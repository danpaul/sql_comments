var async = require('async')

var baseModel = require('./base')

/**
* options should include:
*   knex (knex object, required)
*   tableName
*/
module.exports = function(options, callback){
    var self = this

/*******************************************************************************

                    CONSTRUCTOR
    
*******************************************************************************/

    // see settings.js for flag setting documentation
    this.init = function(){
        self.knex = options.knex
        self.tableName = options.tableName
        self.maximumFlagRate = options.maximumFlagRate
        self.flagPeriod = options.flagPeriod
        self.flagBanPeriod = options.flagBanPeriod
        self.maxFlagBanRate = options.maxFlagBanRate
        self.maxFlagBanPeriod = options.maxFlagBanPeriod
    }

/*******************************************************************************

                    MAIN FUNCTIONS
    
*******************************************************************************/
    
    this.isBanned = function(userId, callbackIn){
        self.knex(self.tableName)
            .select(['created', 'is_banned', 'is_permanently_banned'])
            .where('user', userId)
            .andWhere('is_banned', true)
            .then(function(rows){

                if( rows.length === 0 ){
                    callbackIn(null, false)
                    return
                }

                var userBan = rows[0]
                if( self.banHasExpired(userBan) ){
                    this.liftUserBan(userId, function(err){
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

    this.liftUserBan = function(userId, callbackIn){
        self.knex(self.tableName)
            .where('user', userId)
            .update({'is_banned': false})
            .then(function(){callbackIn})
            .catch(callbackIn)
    }

/*******************************************************************************

                    HELPER FUNCTIONS
    
*******************************************************************************/

    this.banHasExpired = function(userBan){
        if( userBan['is_permanently_banned'] ){ return false; }
        if( (baseModel.getCurrentTimestamp() - self.flagBanPeriod) >
            userBan.created ){

            return true
        }
        return false
    }

    this.getFlagPeriod = function(){
        return self.flagPeriod
    }



    this.init()
}