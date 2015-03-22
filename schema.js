var schema = {}

var _ = require('underscore')
var async = require('async')

schema.definition = {

    comment: function(table){
        table.increments()
        table.integer('post').default(0).index()
        table.integer('parent').default(0).index()
        table.integer('user').default(0).index()
        table.float('rank').default(0.0).index()
        // table.string('ip').default('').index()
        table.integer('up_vote').default(0)
        table.integer('down_vote').default(0)
        table.integer('flag_count').default(0)
        table.boolean('is_deleted').default(false)
        table.integer('created').default(0)
        table.text('comment').default("")
    },

    userVote: function(table){
        table.integer('user'),
        table.integer('comment'),
        table.boolean('up_vote').default(false)
        table.primary(['user', 'comment'])
    },

    flaggedUserLog: function(table){
        table.increments()
        table.integer('user').default(0).index(),
        table.integer('created').default(0).index(),
        table.integer('comment').default(0)
    },

    userBan: function(table){
        table.increments()
        table.integer('user').default(0).index()
        table.integer('created').default(0)
        table.boolean('is_banned').default(true).index()
        table.boolean('is_permanently_banned').default(false)
    },

    userFlagBan: function(table){
        table.increments()
        table.integer('user').default(0).index()
        table.integer('created').default(0)
        table.boolean('is_banned').default(true).index()
        table.boolean('is_permanently_banned').default(false)   
    },

    userFlagLog: function(table){
        table.integer('user')
        table.integer('comment')
        table.integer('created').index()
        table.primary(['user', 'comment'])
    }

}

schema.init = function(prefix,
                       knex,
                       callbackIn){

        var tableNames = _.keys(schema.definition)

        async.eachSeries(tableNames, function(tableName, callback){

            var fullTableName = prefix + tableName;

            knex.schema.hasTable(fullTableName)
                .then(function(exists) {

                    if( !exists ){

                        // create the table
                        knex.schema.createTable(fullTableName,
                                                schema.definition[tableName])

                            .then(function(){ callback(); })
                            .catch(callback)

                    } else { callback(); }
                })
                .catch(callback)            
        },
        function(err){
            if(err){
                callbackIn(err)
            } else {
                callbackIn()
            }
        })
}

module.exports = schema