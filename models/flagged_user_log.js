/**
* Logs flags user makes on another user's posts
*/

var _ = require('underscore')
var async = require('async')

var baseModel = require('./base')

/**
* options should include:
*   knex (knex object, required)
*   tableName (required)
*/
module.exports = function(options, callback){
    var self = this

/*******************************************************************************

                    CONSTRUCTOR
    
*******************************************************************************/

    this.init = function(){
        self.knex = options.knex
        self.tableName = options.tableName
        self.flagPeriod = options.flagPeriod
        self.maximumFlagRate = options.maximumFlagRate
    }

/*******************************************************************************

                    MAIN FUNCTIONS
    
*******************************************************************************/

// self.userFlagBanModel.log
    /**
    * Passes back `false` if user has already flagged comment or user has 
    *   excessive number of flags, otherwise, passes back `false`
    */
    this.log = function(userId, commentId, callbackIn){

        var flagPeriodStart = baseModel.getCurrentTimestamp() - self.flagPeriod
// console.log(commentId)
// return
        self.knex(self.tableName)
            .select(['comment'])
            .where('user', userId)
            .andWhere('created', '>', flagPeriodStart)
            .then(function(flagRecords){

                // check if user has already voted
                var previousVote = _.findWhere(flagRecords,
                                               {comment: commentId})
                if( previousVote ){
                    callbackIn(null, false)
                    return
                }

                // check for excessive flags



                // check if user has flagged
console.log(flagRecords)
            })
            .catch(callbackIn)

        // check if user has already flagged

        // check if user has excessive flags

            // if has, trigger flag ban

        // log flag

        // check if log will result in e
    }

/*******************************************************************************

                    HELPER FUNCTIONS
    
*******************************************************************************/

    this.init()
}