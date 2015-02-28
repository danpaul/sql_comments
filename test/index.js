/*******************************************************************************

					DATA / SETUP

*******************************************************************************/

var config = require('./config')

var async = require('async')

var SqlComment = require('../index')
var sqlComment;

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

async.waterfall([

	function(callback){
		sqlComment = new SqlComment({knex: knex, tableName: 'comment_test'},
									callback)
	},

	function(sqlCommentIn, callback){
		sqlComment = sqlCommentIn;
console.log('foo')
	}


],
function(err){})

