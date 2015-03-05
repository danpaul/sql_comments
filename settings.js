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
    flagPeriod: 600,

}