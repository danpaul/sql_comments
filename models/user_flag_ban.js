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

    this.init = function(){
        self.knex = options.knex
        self.tableName = options.tableName
        self.maximumFlagRate = options.maximumFlagRate
        self.flagPeriod = options.flagPeriod
    }

/*******************************************************************************

                    MAIN FUNCTIONS
    
*******************************************************************************/
    



    this.init()
}