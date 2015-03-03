var _ = require('underscore')
var async = require('async')

var models = require('./models/index')
var defaultSettings = require('./settings')

var DEFAULT_TABLE_PREFIX = 'sql_comment_'
var DEAFULT_Z_SCORE = 1

/**
* options should include:
*   knex (knex object, required),
*   tablePrefix(defaults to "sql_comment")
*   zScore for Wilson score defaults to `DEFAULT_Z_SCORE`
* see settings.js for default setting that can be overridden
*/
module.exports = function(options, settings, callback){
    var self = this

    var commentModel
    var voteModel

/*******************************************************************************

                    CONSTRUCTOR
    
*******************************************************************************/

    this.init = function(){
        self.knex = options.knex

        var prefix = DEFAULT_TABLE_PREFIX
        if( options.tablePrefix ){
            prefix = options.tablePrefix
        }

        var zScore = DEAFULT_Z_SCORE
        if( options.zScore ){
            zScore = options.zScore
        }

        if( settings ){
            self.settings = {}
            _.each(defaultSettings, function(v,k){
                if( settings[k] ){
                    self.settings[k] = settings[k]
                } else {
                    self.settings[k] = defaultSettings[k]
                }                
            })
        } else {
            self.settings = defaultSettings
        }

        var commentTable = prefix + 'comment'
        var voteTable = prefix + 'vote'
        var flaggedUserLogTable = prefix + 'flaggedUserLog'
        var userBanTable = prefix + 'userBan'
        var userFlagBanTable = prefix + 'userFlagBan'
        var userFlagLogTable = prefix + 'userFlagLog'

        commentModel = new models.comment({knex: options.knex,
                                           tableName: commentTable,
                                            zScore: zScore})

        voteModel = new models.vote({knex: options.knex,
                                    tableName: voteTable,
                                    commentModel: commentModel})

        self.add = commentModel.add
        self.delete = commentModel.delete
        self.getComment = commentModel.getComment
        self.getComments = commentModel.getComments

        self.vote = voteModel.vote

        // init tables
        require('./schema')(commentTable,
                            voteTable,
                            flaggedUserLogTable,
                            userBanTable,
                            userFlagBanTable,
                            userFlagLogTable,
                            self.knex,
                            callback)

    }

/******************************************************************************/

    this.init()
}