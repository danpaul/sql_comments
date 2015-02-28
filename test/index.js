/*******************************************************************************

					DATA / SETUP

*******************************************************************************/

var config = require('./config')

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

/*******************************************************************************

					TEST

*******************************************************************************/

var userId = 1
var postId = 1

async.waterfall([

	function(callback){
		sqlComment = new SqlComment({knex: knex, tableName: 'comment_test'},
									callback)
	},

    // add commeent
	function(callback){

// console.log(sqlComment.test)
        sqlComment.add(userId, postId, 0, 'This is a comment', callback)
	},

    function(callback){
        callback()
    }

],
function(err){})

