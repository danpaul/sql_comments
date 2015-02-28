var async = require('async')

var DEFAULT_TABLE_PREFIX = 'sql_comment_'

/**
* options should include: knex (knex object), tablePrefix(defaults to "sql_comment")
*/
module.exports = function(options, callback){
    var self = this

    var commentTable
    var voteTable

this.test = 'asdf'

/*******************************************************************************

                    CONSTRUCTOR
    
*******************************************************************************/

    this.init = function(){
        self.knex = options.knex

        var prefix = DEFAULT_TABLE_PREFIX
        if( options.tablePrefix ){
            prefix = options.tablePrefix
        }

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
                comment: comment
            })
            .then(function(){callbackIn()})
            .catch(callbackIn)
    }

    this.init()
}