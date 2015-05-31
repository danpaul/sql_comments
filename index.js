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
module.exports = function(options, callback){
    var self = this

    var commentModel
    var voteModel

/*******************************************************************************

                    CONSTRUCTOR
    
*******************************************************************************/

    this.init = function(){

        if( !options.knex ){ throw 'sql_comments requires knex objection'; }
        self.knex = options.knex

        self.settings = {}
        _.each(defaultSettings, function(v,k){
            if( typeof(options[k]) !== 'undefined' ){
                self.settings[k] = options[k]
            } else {
                self.settings[k] = defaultSettings[k]
            }                
        })

        // get table names
        var tableNames = {}
        _.each(_.keys(schema.definition), function(k){
            tableNames[k] = self.settings.tablePrefix + k
        })

        // init models
        self.commentModel = new models.comment({knex: options.knex,
                                                tableName: tableNames['comment'],
                                                zScore: self.settings.zScore})

        self.voteModel = new models.vote({knex: options.knex,
                                         tableName: tableNames['userVote'],
                                         commentModel: self.commentModel})

        models.userFlagBan.init({
            knex: options.knex,
            tableName: tableNames['userFlagBan'],
            maximumFlagRate: self.settings.maximumFlagRate,
            flagPeriod: self.settings.flagPeriod,
            flagBanPeriod: self.settings.flagBanPeriod,
            maxFlagBanRate: self.settings.maxFlagBanRate,
            maxFlagBanPeriod: self.settings.maxFlagBanPeriod
        })

        models.flaggedUserLog.init({knex: options.knex,
                                    tableName: tableNames['flaggedUserLog'],
                                    maximumFlagRate: self.settings.maximumFlagRate,
                                    flagPeriod: self.settings.flagPeriod})

        self.add = self.commentModel.add
        self.addForUser = self.commentModel.addForUser
        self.delete = self.commentModel.delete
        self.getComment = self.commentModel.getComment
        self.getComments = self.commentModel.getComments
        self.getFormattedComments = self.commentModel.getFormattedComments

        self.vote = self.voteModel.vote

        self.flagUser = models.flag.flagUser

        schema.init(self.settings.tablePrefix,
                    self.knex,
                    self.settings,
                    callback);

    }

/******************************************************************************/

    this.init()
}