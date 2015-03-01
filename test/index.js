/*******************************************************************************

					DATA / SETUP

*******************************************************************************/

var config = require('./config')

var _ = require('underscore')
var assert = require('assert')
var async = require('async')

var SqlComment = require('../index')

var dbCreds = {
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'sql_comment',
        port:  8889
    }
}

var knex = require('knex')(dbCreds)

var TABLES = ['sql_comment_comment', 'sql_comment_vote']

var settings = {
    numberOfTopComments: 10
}

/*******************************************************************************

                    HELPERS

*******************************************************************************/

var clearTables = function(callbackIn){
    async.eachSeries(TABLES, function(table, callback){
        clearTable(table, callback)
    }, callbackIn)
}

var clearTable = function(table, callbackIn){
        knex(table)
            .truncate()
            .then(function(){ callbackIn(); })
            .catch(callbackIn)
}

/*******************************************************************************

					TEST

*******************************************************************************/

var userId = 1
var postId = 1
var topComments;

async.waterfall([

    function(callback){
        sqlComment = new SqlComment({knex: knex}, callback)
    },

    clearTables,

    // add commeents
	function(callback){
        async.eachSeries(_.range(settings.numberOfTopComments),
                         function(number, callbackB){

            sqlComment.add(userId, postId, 0, 'This is a comment', callbackB)

        }, callback)
	},

    // get comments
    function(callback){
        sqlComment.get(postId, false, callback)
    },

    function(comments, callback){
        topComments = comments
        assert((comments.length === settings.numberOfTopComments),
               'Incorrect number of comments created')
        assert((comments[0].comment === 'This is a comment'),
               'Comment content not correct')
        callback()
    },

    



],
function(err){
    if( err ){ console.log(err) }
    else{ console.log('sql_comment tests passed') }
})


