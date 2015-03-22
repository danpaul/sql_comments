## About

Sql Comment is an SQL backed ([Knex](http://knexjs.org/) compatible) comment service written in node. Sql Comment does not sanitize user input (so you shound handle that yourself). The basic functionality has been formally tested but tests still need to get written for some of the flagging functionality so I can't guarantee these features are entirely stable yet.

Sql Comment uses [Wilson Score](http://www.evanmiller.org/how-not-to-sort-by-average-rating.html) (Reddit's best comment scoring system) ranking system and uses a configurable flagging system.

## Settings

There are a handful of flagging settings that affect how flagged comments are handled and how users who are flagged too often and users who flag comments too often are handled. If a user's comment is flagged above a certain threshold and is above a certain flag to up vote threshold, it will get deleted. If a user has too many flags in a certain period of time, they will be banned from commenting for a certain amount of time. If a user gets banned too many times, they will be permanently banned. Finally, if a user flags too many comments in a certain amount of time the will get banned from flagging for a period of time. If they get banned from flagging too many times, they will get permanently banned from flagging.

Take a look at [settings]('./settings.js') to see the defaults for flagging and other settings. These can get overridden via the options parameter passed to the consctructor.

## Example

```Javascript
var _ = require('underscore')
var async = require('async')
var knex = require('knex')

var SqlComment = require('./index')

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

var userId = 1
var postId = 1
var comment

async.waterfall([

    // initialize
    function(callback){

        sqlComment = new SqlComment({knex: knex},
                                    {minimumFlagsToBan: 1},
                                    callback)
    },

    // add comments
    function(callback){
        sqlComment.add(userId, postId, 0, 'This is a comment', callback)
    },

    // get comments
    function(callback){
        sqlComment.getComments(postId, false, callback)
    },

    // delete comment
    function(callback){
        sqlComment.delete(commentId, callback)
    },

    // get comments do not include deleted comments (second argument specifices
    //  weather to include deleted comments)
    function(callback){
        sqlComment.getComments(postId, false, function(err, comments){
            if( err ){ callback(err) }
            else{ comment = comments[0] }
        })
    },

    // cast upvote for post 2
    // third argument "isUpvote", if `true` an upvote gets cast, else a downvote
    function(callback){
        sqlComment.vote(userId, comment['id'], true, callback)
    },

    // add nested comment to comment 2
    function(callback){
        sqlComment.add(userId,
                       postId,
                       comment['id'],
                       'This is a nested comment',
                       callback)
    },

    // flag comment
    // first argument is the user who is flagging
    // second argument is the comment getting flagged
    function(callback){
        sqlComment.flagUser(userId, comment['id'], callback)
    },

    // get formatted comments including delted comments
    function(callback){
        sqlComment.getFormattedComments(postId, true, function(err, comments){
            if( err ){ callback(err) }
            else{
                console.log(comments)
            }
        })
    }

],
function(err){
    if( err ){ console.log(err) }
    else{ console.log('done.') }
})
```