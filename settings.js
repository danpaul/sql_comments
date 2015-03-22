var tenMinutes = 60 * 10
var oneWeek = 60 * 60 * 24 * 7
var fourWeeks = oneWeek * 4

/**
These options can also get passed to the constructor
    tablePrefix (defaults to "sql_comment_")
    zScore (defaults to 1)
*/

module.exports = {
    
    // comment must be flagged at least this many times before it's deleted
    minimumFlagsToBan: 3,

    // if flags / upvotes is greater than or equal to this number, the post will
    //  be delted
    flagPercentageToBan: 0.1,

    // if user flags more than this many posts over the past `flagPeriod`, 
    //  they will be banned from flagging
    maximumFlagRate: 40,

    // period to check if user has flagged too many posts (in seconds)
    flagPeriod: tenMinutes,

    // period users get banned for if they flag too much
    flagBanPeriod: oneWeek,

    // if user is banned for flagging this many times in
    //  `maxFlagBanPeriod`, they will be permanently banned from flagging
    maxFlagBanRate: 3,

    maxFlagBanPeriod: fourWeeks

}