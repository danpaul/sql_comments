/**
* Main driver for user flagging
*/

var flag = {}

var userFlagBanModel = require('./user_flag_ban')
var flaggedUserLog = require('./flagged_user_log')

/*******************************************************************************

                    MAIN FUNCTIONS

*******************************************************************************/

/**
* Passes back `true` if user has not been banned from flagging, and user has
*   not already flagged comment, else `false`
*/
flag.flagUser = function(userId, commentId, callbackIn){

    // confirm user has not been banned from excessive flagging
    userFlagBanModel.isBanned(userId, function(err, isBanned){

        if( isBanned ){
            callbackIn(null, false)
            return
        }

        // log users flag
        flaggedUserLog.log(userId,
                           commentId,
                           function(err, hasNotYetFlagged){
            if( err ){
                callbackIn(err)
                return
            }

            if( !hasNotYetFlagged ){
                callbackIn(null, false)
                return
            }

            userFlagBanModel.updateUserBan(userId, function(err){
                if( err ){ callbackIn(err)
                } else {
                    callbackIn(null, true)
                }
            })
        })
    })
}

module.exports = flag