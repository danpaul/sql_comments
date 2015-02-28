var async = require('async')

var DEFAULT_TABLE_PREFIX = 'sql_comment_'

/**
* options should include: knex (knex object), tablePrefix(defaults to "sql_comment")
*/
module.exports = function(options, callback){
    var self = this

    var commentTable
    var voteTable

/*******************************************************************************

                    INIT
    
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

    this.init()
}