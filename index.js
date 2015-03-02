var async = require('async')
var decay = require('decay')

var models = require('./models/index')

var DEFAULT_TABLE_PREFIX = 'sql_comment_'
var DEAFULT_Z_SCORE = 1

/**
* options should include:
*   knex (knex object, required),
*   tablePrefix(defaults to "sql_comment")
*   zScore for Wilson score defaults to `DEFAULT_Z_SCORE`
*/
module.exports = function(options, callback){
    var self = this

    var commentTable
    var voteTable
    var flaggedUserTable
    var wilsonScore

    var commentModel;

/*******************************************************************************

                    CONSTRUCTOR
    
*******************************************************************************/

    this.init = function(){
        self.knex = options.knex

        var prefix = DEFAULT_TABLE_PREFIX
        if( options.tablePrefix ){
            prefix = options.tablePrefix
        }

        var zScore = DEAFULT_Z_SCORE
        if( options.zScore ){
            zScore = options.zScore
        }

        wilsonScore = decay.wilsonScore(zScore)

        commentTable = prefix + 'comment'
        voteTable = prefix + 'vote'
        flaggedUserTable = prefix + 'flaggedUser'

        commentModel = new models.comment({knex: options.knex,
                                           tableName: commentTable})

        self.add = commentModel.add
        self.delete = commentModel.delete
        self.getComments = commentModel.getComments

        // init tables
        require('./schema')(commentTable,
                            voteTable,
                            flaggedUserTable,
                            self.knex,
                            callback)

    }

/*******************************************************************************

                    MAIN FUNCTIONS
    
*******************************************************************************/



    /**
    * Gets all details of individual commaent
    * Passes back `null` if comment is not found
    */
    this.getComment = function(commentId, callbackIn){
        self.knex(commentTable)
            .where('id', commentId)
            .then(function(rows){
                if( rows.length === 0 ){
                    callbackIn(null, null)
                } else {
                    callbackIn(null, rows[0])
                }
            })
    }

    /**
    * Updates comment vote and user vote log (so user can not vot twice)
    * Todo: write sql statement to update vote and score in same step
    */
    this.vote = function(userId, commentId, isUpvote, callbackIn){

        // confirm user has not vote
        self.knex(voteTable)
            .where('user', userId)
            .andWhere('comment', commentId)
            .then(function(rows){

                if( rows.length !== 0 ){
                    callbackIn()
                    return
                }

                async.waterfall([

                    function(callback){

                        // increment correct column
                        var voteColumn = isUpvote ? 'up_vote' : 'down_vote'

                        self.knex(commentTable)
                            .where('id', commentId)
                            .increment(voteColumn, 1)
                            .then(function(){ callback() })
                            .catch(callback)
                    },

                    // fetch row
                    function(callback){
                        self.knex(commentTable)
                            .select(['up_vote', 'down_vote'])
                            .where('id', commentId)
                            .then(function(rows){ callback(null, rows[0]) })
                            .catch(callback)
                    },

                    // update score
                    function(comment, callback){
                        var rank = wilsonScore(comment['up_vote'],
                                               comment['down_vote'])
                        self.knex(commentTable)
                            .where('id', commentId)
                            .update({rank: rank})
                            .then(function(){ callback() })
                            .catch(callback)
                    },

                    // update user log
                    function(callback){
                        self.knex(voteTable)
                            .insert({
                                user: userId,
                                comment: commentId,
                                up_vote: isUpvote
                            })
                            .then(function(){ callback() })
                            .catch(callback)
                    }

                ], callbackIn)

            })
            .catch(callbackIn)

    }


/******************************************************************************/

    this.init()
}