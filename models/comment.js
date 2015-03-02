var async = require('async')
// var decay = require('decay')


var baseModel = require('./base')
// var models = require('./models/index')

// var DEFAULT_TABLE_PREFIX = 'sql_comment_'
// var DEAFULT_Z_SCORE = 1

/**
* options should include:
*   knex (knex object, required),
*   tableName
*/
module.exports = function(options, callback){
    var self = this

    var knex

    var tableName

/*******************************************************************************

                    CONSTRUCTOR
    
*******************************************************************************/

    this.init = function(){

        self.knex = options.knex
        self.tableName = options.tableName

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
    * Returns all comments for a post
    * `includeDeleted` if set to true will include deleted posts
    */
    this.getComments = function(postId, includeDeleted, callbackIn){

        var query = self.knex(self.tableName)
            .where({ post: postId })

        if( !includeDeleted ){
            query.andWhere({is_deleted: false})
        }

        query.then(function(rows){ callbackIn(null, rows)})
            .catch(callbackIn)
    }

    this.init()
}