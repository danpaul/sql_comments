var _ = require('underscore')
var async = require('async')
var decay = require('decay')

var baseModel = require('./base')

/**
* options should include:
*   knex (knex object, required),
*   tableName
*/
module.exports = function(options, callback){
    var self = this

/*******************************************************************************

                    CONSTRUCTOR
    
*******************************************************************************/

    this.init = function(){

        self.knex = options.knex
        self.tableName = options.tableName
        self.wilsonScore = decay.wilsonScore(options.zScore)
    }

/*******************************************************************************

                    MAIN FUNCTIONS
    
*******************************************************************************/

    /**
    * All Id fields should be integers
    * Pass 0 as parent if it is top level
    */
    this.add = function(userId, postId, parentId, comment, callbackIn){
        self.knex(self.tableName)
            .insert({
                user: userId,
                post: postId,
                parent: parentId,
                comment: comment,
                created: baseModel.getCurrentTimestamp()
            })
            .then(function(){callbackIn()})
            .catch(callbackIn)
    }

    /**
    * Same as this.add except includes another argument for username
    */
    this.addForUser = function(userId,
                               username,
                               postId,
                               parentId,
                               comment,
                               callbackIn){

        self.knex(self.tableName)
            .insert({
                user: userId,
                username: username,
                post: postId,
                parent: parentId,
                comment: comment,
                created: baseModel.getCurrentTimestamp()
            })
            .then(function(){callbackIn()})
            .catch(callbackIn)
    }

    /**
    * Sets `is_deleted` to `true` for comment
    */
    this.delete = function(commenId, callbackIn){
        self.knex(self.tableName)
            .where({id: commenId})
            .update({is_deleted: true})
            .then(function(){ callbackIn() })
            .catch(callbackIn)
    }

    /**
    * Gets all details of individual comment
    * Passes back `null` if comment is not found
    */
    this.getComment = function(commentId, callbackIn){
        self.knex(self.tableName)
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
    * Returns all comments for a post
    * `includeDeleted` if set to true will include deleted posts
    */
    this.getComments = function(postId, includeDeleted, callbackIn){

        var query = self.knex(self.tableName)
            .where({ post: postId })
            .orderBy('rank', 'desc')

        if( !includeDeleted ){
            query.andWhere({is_deleted: false})
        }

        query.then(function(rows){ callbackIn(null, rows)})
            .catch(callbackIn)
    }

    /**
    * Passes back an array of top level comment objects
    */
    this.getFormattedComments = function(postId,
                                         includeDeleted,
                                         callbackIn){

        self.getComments(postId, includeDeleted, function(err, comments){

            if( err ){
                callbackIn(err)
                return
            }

            var commentMap = {}
            var topLevelComments = [];

            _.each(comments, function(comment){
                commentMap[comment.id.toString()] = comment
                comment.children = []
            })

            _.each(comments, function(comment){
                if( comment.parent !== 0 ){
                    commentMap[comment.parent].children.push(comment)
                }
            })

            _.each(commentMap, function(v, k){                
                if( v.parent === 0 ){
                    topLevelComments.push(commentMap[k]);
                }
            })

            callbackIn(null, topLevelComments);
        })

    }

    /**
    * Updates comment vote
    * Todo: write query to perform all operations in one step
    */
    this.updateVote = function(commentId, isUpvote, callbackIn){

        async.waterfall([

            function(callback){

                var voteColumn = isUpvote ? 'up_vote' : 'down_vote'

                self.knex(self.tableName)
                    .where('id', commentId)
                    .increment(voteColumn, 1)
                    .then(function(){ callback() })
                    .catch(callback)
            },

            // fetch row
            function(callback){
                self.knex(self.tableName)
                    .select(['up_vote', 'down_vote'])
                    .where('id', commentId)
                    .then(function(rows){ callback(null, rows[0]) })
                    .catch(callback)
            },

            // update score
            function(comment, callback){
                var rank = self.wilsonScore(comment['up_vote'],
                                            comment['down_vote'])
                self.knex(self.tableName)
                    .where('id', commentId)
                    .update({rank: rank})
                    .then(function(){ callback() })
                    .catch(callback)
            },
        ], callbackIn)

    }

    this.init()
}