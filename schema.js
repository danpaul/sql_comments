var async = require('async')

var commentSchema = function(table){
    table.increments()
    table.integer('post').default(0).index()
    table.integer('parent').default(0).index()
    table.integer('user').default(0).index()
    table.integer('up_vote').default(0).index()
    table.integer('down_vote').default(0).index()        
    table.float('rank').default(0.0).index()
    table.integer('flag_count').default(0)
    table.boolean('is_deleted').default(false)
    table.integer('created').default(0)
    table.text('comment').default("")
}

var userVoteSchema = function(table){
    table.integer('user'),
    table.integer('comment'),
    table.boolean('up_vote').default(false)
    table.primary(['user', 'comment'])
}

var flaggedUserLogSchema = function(table){
    table.increments()
    table.integer('user').default(0).index(),
    table.integer('created').default(0).index(),
    table.integer('comment').default(0)
}

var userBanSchema = function(table){
    table.increments()
    table.integer('user').default(0).index()
    table.integer('created').default(0)
    table.boolean('is_banned').default(true).index()
    table.boolean('is_permanently_banned').default(false)
}

var userFlagBanSchema = function(table){
    table.increments()
    table.integer('user').default(0).index()
    table.integer('created').default(0)
    table.boolean('is_banned').default(true).index()
    table.boolean('is_permanently_banned').default(false)   
}

var userFlagLogSchema = function(table){
    table.integer('user')
    table.integer('post')
    table.integer('created').index()
    table.primary(['user', 'post'])
}

module.exports = function(commentTableName,
                          userVoteTableName,
                          flaggedUserLogTableName,
                          userBanTableName,
                          userFlagBanTableName,
                          userFlagLogTableName,
                          knex,
                          callbackIn){

        var tableData = [
            {tableName: commentTableName, schema: commentSchema},
            {tableName: userVoteTableName, schema: userVoteSchema},
            {tableName: flaggedUserLogTableName, schema: flaggedUserLogSchema},
            {tableName: userBanTableName, schema: userBanSchema},
            {tableName: userFlagBanTableName, schema: userFlagBanSchema},
            {tableName: userFlagLogTableName, schema: userFlagLogSchema}
        ]

        async.eachSeries(tableData, function(tableInfo, callback){
            knex.schema.hasTable(tableInfo.tableName)
                .then(function(exists) {
                    if( !exists ){
                        // create the table
                        knex.schema.createTable(tableInfo.tableName,
                                                tableInfo.schema)

                            .then(function(){ callback(); })
                            .catch(callback)

                    } else { callback(); }
                })
                .catch(callback)            
        },
        function(err){
            if(err){ 
console.log(err)
                callbackIn(err) }
            else{ callbackIn() }
        })
}