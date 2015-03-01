var async = require('async')
var decay = require('decay')

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
    var wilsonScore

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

        // init tables
        require('./schema')(commentTable, voteTable, self.knex, callback)
    }

/*******************************************************************************

                    MAIN FUNCTIONS
    
*******************************************************************************/

    /**
    * All Id fields should be integers
    * Pass 0 as parent if it is top level
    */
    this.add = function(userId, postId, parentId, comment, callbackIn){
        self.knex(commentTable)
            .insert({
                user: userId,
                post: postId,
                parent: parentId,
                comment: comment,
                created: self.getCurrentTimestamp()
            })
            .then(function(){callbackIn()})
            .catch(callbackIn)
    }

    /**
    * Sets `is_deleted` to `true` for comment
    */
    this.delete = function(commenId, callbackIn){
        self.knex(commentTable)
            .where({id: commenId})
            .update({is_deleted: true})
            .then(function(){ callbackIn() })
            .catch(callbackIn)
    }

    /**
    * Returns all comments for a post
    * `includeDeleted` if set to true will include deleted posts
    */
    this.get = function(postId, includeDeleted, callbackIn){

        var query = self.knex(commentTable)
            .where({ post: postId })

        if( !includeDeleted ){
            query.andWhere({is_deleted: false})
        }

        query.then(function(rows){ callbackIn(null, rows)})
            .catch(callbackIn)
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


/*******************************************************************************

                    HELPER FUNCTIONS
    
*******************************************************************************/

    this.getCurrentTimestamp = function(){
        return Math.floor(Date.now() / 1000)
    }


/******************************************************************************/

    this.init()
}