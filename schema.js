var schema = {}

var _ = require('underscore')
var async = require('async')
var debug = require('debug')('sql_comment')

var SchemaBuilder = function(options){
    var self = this;
    
    self.useStringPostId = options.useStringPostId ? true : false;
    self.useUsername = options.useUsername ? true : false;

    debug('Using string postId', self.useStringPostId)
    debug('Using username', self.useUsername)

    self.getCommentSchema = function(){
        return function(table){
            table.increments()
            if( self.useStringPostId ){
                table.string('post').default('').index()
            } else {
                table.integer('post').default(0).index()
            }
            if( self.useUsername ){
                table.string('username').default('').index()
            }
            table.integer('parent').default(0).index()
            table.integer('user').default(0).index()
            table.float('rank').default(0.0).index()
            table.integer('up_vote').default(0)
            table.integer('down_vote').default(0)
            table.integer('flag_count').default(0)
            table.boolean('is_deleted').default(false)
            table.integer('created').default(0)
            table.text('comment').default("")            
        }
    }

    self.getSchema = function(){
        var schema = {
         
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

        };

        schema.comment = self.getCommentSchema();

        return schema;
    }

}

schema.init = function(prefix,
                       knex,
                       options,
                       callbackIn){

        debug('Schema init')

        var schemaBuilder = new SchemaBuilder(options);
        var schemaDefinition = schemaBuilder.getSchema();
        var tableNames = _.keys(schemaDefinition);

        debug('Tables', tableNames);

        async.eachSeries(tableNames, function(tableName, callback){

            var fullTableName = prefix + tableName;

            knex.schema.hasTable(fullTableName)
                .then(function(exists) {

                    debug('comment table exists', exists);

                    if( !exists ){

                        // create the table
                        knex.schema.createTable(fullTableName,
                                                schemaDefinition[tableName])

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

module.exports = schema;