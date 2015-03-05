var _ = require('underscore')
var async = require('async')

var models = require('./models/index')
var defaultSettings = require('./settings')
var schema = require('./schema')

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

        // override default table prefix
        var prefix = DEFAULT_TABLE_PREFIX
        if( options.tablePrefix ){
            prefix = options.tablePrefix
        }

        // override default z score
        var zScore = DEAFULT_Z_SCORE
        if( options.zScore ){
            zScore = options.zScore
        }

        // override default settings
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

        // get table names
        var tableNames = {}
        _.each(_.keys(schema.definition), function(k){
            tableNames[k] = prefix + k
        })

        // init models
        self.commentModel = new models.comment({knex: options.knex,
                                                tableName: tableNames['comment'],
                                                zScore: zScore})

        self.voteModel = new models.vote({knex: options.knex,
                                         tableName: tableNames['userVote'],
                                         commentModel: self.commentModel})

        self.userFlagBanModel =
             new models.userFlagBan({knex: options.knex,
                                    tableName: tableNames['userFlagBan'],
                                    maximumFlagRate: settings.maximumFlagRate,
                                    flagPeriod: settings.flagPeriod})


        self.add = self.commentModel.add
        self.delete = self.commentModel.delete
        self.getComment = self.commentModel.getComment
        self.getComments = self.commentModel.getComments

        self.vote = self.voteModel.vote

        schema.init(prefix, self.knex, callback)

    }

/*******************************************************************************

                    MAIN METHODS
    
*******************************************************************************/

    /**
    * User id is for the user id who is flagging (not flagged)
    */
    this.flag = function(commentId, userId, callback){

        // confirm user is allowed to flag

        // confirm user has not yet flagged

        // flag post

        // determine if post should be deleted

        // determine if user should be termporarily or permanently banned

    }

/******************************************************************************/

    this.init()
}