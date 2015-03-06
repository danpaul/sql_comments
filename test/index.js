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

var TABLES = _.map(_.keys(require('../schema').definition), function(v){
    return 'sql_comment_' + v
})

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
var nestedComment1;
var nestedComment2;

async.waterfall([

    function(callback){

        sqlComment = new SqlComment({knex: knex},
                                    {minimumFlagsToBan: 1},
                                    callback)
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
        sqlComment.getComments(postId, false, callback)
    },

    function(comments, callback){
        topComments = comments
        assert((comments.length === settings.numberOfTopComments),
               'Incorrect number of comments created')
        assert((comments[0].comment === 'This is a comment'),
               'Comment content not correct')
        callback()
    },

    // delete first comment
    function(callback){
        var commentId = topComments[0]['id']
        sqlComment.delete(commentId, callback)
    },

    // get comments
    function(callback){
        sqlComment.getComments(postId, false, callback)
    },

    // confirm delete
    function(comments, callback){
        assert((comments.length === settings.numberOfTopComments - 1),
               'Incorrect number of comments after delete')
        callback()
    },

    // cast upvote for post 2
    function(callback){
        sqlComment.vote(userId, topComments[1]['id'], true, callback)
    },

    // refresh comments
    function(callback){
        sqlComment.getComments(postId, true, callback)
    },

    // confirm vote was registered
    function(comments, callback){
        topComments = comments
        assert((topComments[1]['up_vote'] === 1), 'Upvote not registered')
        assert((topComments[1]['down_vote'] === 0),
               'Downvote incorrectly registered')
        callback()
    },

    // try to vote again for same post
    function(callback){
        sqlComment.vote(userId, topComments[1]['id'], true, callback)
    },

    function(callback){
        sqlComment.getComment(topComments[1]['id'], callback)
    },

    function(comment, callback){
        assert((comment['up_vote'] === 1 && comment['down_vote'] === 0),
               'Second vote registered incorrectly')
        callback()
    },

    // add nested comment to comment 2
    function(callback){
        sqlComment.add(userId,
                       postId,
                       topComments[1]['id'],
                       'This is a nested comment',
                       callback)
    },

    // refresh comments
    function(callback){
        sqlComment.getComments(postId, true, callback)
    },

    // confirm vote was registered
    function(comments, callback){

        topComments = comments
        nestedComment1 = topComments[10]
        assert((nestedComment1['comment'] ===
               'This is a nested comment'),
                'Nested comment content not correct')
        assert((nestedComment1['parent'] === topComments[1]['id']),
               'Nested comment parent not correct')
        callback()
    },

    // add nested comment to nested comment
    function(callback){
        sqlComment.add(userId,
                       postId,
                       nestedComment1['id'],
                       'This is a nested comment',
                       callback)
    },

    // refresh comments
    function(callback){
        sqlComment.getComments(postId, true, callback)
    },

    function(comments, callback){
        topComments = comments
        nestedComment2 = topComments[11]
        callback()
    },

    // flag comment 3
    function(callback){
        // callback()
        sqlComment.flag(topComments[2], userId, callback)
    }

],
function(err){
    if( err ){ console.log(err) }
    else{ console.log('sql_comment tests passed') }
})