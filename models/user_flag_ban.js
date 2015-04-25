var userFlagBan = {}

var async = require('async')

var baseModel = require('./base')
var flaggedUserLog = require('./flagged_user_log')

var knex
var tableName
var maximumFlagRate
var flagPeriod
var flagBanPeriod
var maxFlagBanRate
var maxFlagBanPeriod


/*******************************************************************************

                    INITIALIZER
    
*******************************************************************************/

// see settings.js for flag setting documentation
userFlagBan.init = function(options){
    knex = options.knex
    tableName = options.tableName
    maximumFlagRate = options.maximumFlagRate
    flagPeriod = options.flagPeriod
    flagBanPeriod = options.flagBanPeriod
    maxFlagBanRate = options.maxFlagBanRate
    maxFlagBanPeriod = options.maxFlagBanPeriod
}

/*******************************************************************************

                    MAIN FUNCTIONS
    
*******************************************************************************/

// passes back `true` if user has been banned, else false
userFlagBan.isBanned = function(userId, callbackIn){
    knex(tableName)
        .select(['created', 'is_banned', 'is_permanently_banned'])
        .where('user', userId)
        .andWhere('is_banned', true)
        .then(function(rows){

            if( rows.length === 0 ){
                callbackIn(null, false)
                return
            }

            var userBan = rows[0]
            if( userFlagBan.banHasExpired(userBan) ){
                userFlagBan.liftUserBan(userId, function(err){
                    if( err ){
                        callbackIn(err)
                    } else {
                        callbackIn(null, false)
                    }
                })
            } else {
                callbackIn(null, true)
            }
        })
        .catch(callbackIn)
}


userFlagBan.liftUserBan = function(userId, callbackIn){
    knex(tableName)
        .where('user', userId)
        .update({'is_banned': false})
        .then(function(){ callbackIn() })
        .catch(callbackIn)
}

/**
* Determines if user has been banned an excessive amount of times
* Passes back `true` if user should be permanently banned, else `false`
*/
userFlagBan.shouldPermanentlyBanUser = function(userId, callbackIn){

    var evaluationPeriodStart = baseModel.getCurrentTimestamp() -
                                maxFlagBanPeriod

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

            callbackIn(null,
                       (maxFlagBanRate <= (countRecord[0]['count(*)'] + 1)))
        })
        .catch(callbackIn)
}

/**
* Checks user log and bans/permanently bans user if excessively flagging
*/
userFlagBan.updateUserBan = function(userId, callbackIn){

    // check log to see if user should be banned
    flaggedUserLog.shouldBanUser(userId, function(err, shouldBan){

        if( err ){
            callbackIn(err)
            return
        }

        if( !shouldBan ){
            callbackIn()
            return
        }

        // check if user should be permanently banned
        userFlagBan.shouldPermanentlyBanUser(userId,
                                             function(err, shouldPermBan){
            var insertRecord = {
                user: userId,
                created: baseModel.getCurrentTimestamp(),
                is_banned: true,
                is_permanently_banned: false
            }

            if( shouldPermBan ){
                insertRecord.is_permanently_banned = true
            }

            knex(tableName)
                .insert(insertRecord)
                .then(function(){ callbackIn() })
                .catch(callbackIn)
        })
    })
}

/*******************************************************************************

                    HELPER FUNCTIONS
    
*******************************************************************************/

userFlagBan.banHasExpired = function(userBan){
// console.log(flagBanPeriod)
    if( userBan['is_permanently_banned'] ){ return false; }
    if( (baseModel.getCurrentTimestamp() - flagBanPeriod) > userBan.created ){

        return true
    }
    return false
}

userFlagBan.getFlagPeriod = function(){
    return flagPeriod
}

module.exports = userFlagBan