/**
* Logs flags user makes on another user's posts
*/

var flaggedUserLog = {}

var _ = require('underscore')
var async = require('async')

var baseModel = require('./base')

var knex
var tableName
var flagPeriod
var maximumFlagRate

/*******************************************************************************

                    INITIALIZER
    
*******************************************************************************/

flaggedUserLog.init = function(options){

    knex = options.knex
    tableName = options.tableName
    flagPeriod = options.flagPeriod
    maximumFlagRate = options.maximumFlagRate

}

/*******************************************************************************

                    MAIN FUNCTION
    
*******************************************************************************/

/**
* Logs user flag, passes back `false` if user has already flagged comment,
*   else passes back `true`
*/
flaggedUserLog.log = function(userId, commentId, callbackIn){

    // confirm user has not yet flagged comment
    flaggedUserLog.hasFlagged(userId, commentId, function(err, hasFlagged){

        if( err ){
            callbackIn(err)
            return
        }

        if( hasFlagged ){
            callbackIn(null, false)
            return
        }

        // log user flag
        knex(tableName)
            .insert({
                user: userId,
                comment: commentId,
                created: baseModel.getCurrentTimestamp()
            })
            .then(function(){ callbackIn(null, true) })
            .catch(callbackIn)
    })
}

/**
* Passes back `true` if user has already flagged comment, else `false`
*/
flaggedUserLog.hasFlagged = function(userId, commentId, callbackIn){

    knex(tableName)
        .where('user', userId)
        .andWhere('comment', commentId)
        .then(function(rows){
            if( rows.length !== 0 ){
                callbackIn(null, true)
            } else {
                callbackIn(null, false)
            }
        })
        .catch(callbackIn)
}

/**
* Passes back `true` if user should be banned, else `false`
*/
flaggedUserLog.shouldBanUser = function(userId, callbackIn){

    var evaluationPeriodStart = baseModel.getCurrentTimestamp() - flagPeriod

    // get a count of user flags from within the evaluation period
    knex(tableName)
        .where('user', userId)
        .andWhere('created', '>', evaluationPeriodStart )
        .count('*')
        .then(function(countRecord){

            if( countRecord.length !== 1 ||
                typeof(countRecord[0]['count(*)']) === 'undefined' ){

                callbackIn(new Error('Could not get flag count'))
                return
            }

            callbackIn(null, (maximumFlagRate < countRecord[0]['count(*)']))
        })
        .catch(callbackIn)

}

module.exports = flaggedUserLog