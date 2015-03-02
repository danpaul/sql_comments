var async = require('async')

var baseModel = require('./base')

/**
* options should include:
*   knex (knex object, required)
*   zScore (required)
*   commentModel (required)
*   tableName
*/
module.exports = function(options, callback){
    var self = this

/*******************************************************************************

                    CONSTRUCTOR
    
*******************************************************************************/

    this.init = function(){

        self.commentModel = options.commentModel
        self.knex = options.knex
        self.tableName = options.tableName
        self.zScore = options.zScore

    }

/*******************************************************************************

                    MAIN FUNCTIONS
    
*******************************************************************************/

    /**
    * Updates comment vote and user vote log (so user can not vot twice)
    * Todo: write sql statement to update vote and score in same step
    */
    this.vote = function(userId, commentId, isUpvote, callbackIn){

        // confirm user has not vote
        self.knex(self.tableName)
            .where('user', userId)
            .andWhere('comment', commentId)
            .then(function(rows){

                if( rows.length !== 0 ){
                    callbackIn()
                    return
                }

                self.commentModel.updateVote(commentId,
                                             isUpvote,
                                             function(err){

                    if( err ){
                        callbackIn(err)
                        return
                    }

                    self.knex(self.tableName)
                        .insert({
                            user: userId,
                            comment: commentId,
                            up_vote: isUpvote
                        })
                        .then(function(){ callbackIn() })
                        .catch(callbackIn)
                })
            })
            .catch(callbackIn)
    }

    this.init()
}