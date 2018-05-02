export class utilsService {
    constructor() {
        'ngInject';
    }

    /**
     * Count the number of days in the month of a date
     *
     * @param {DATE} date The date to check the month of
     * @returns {INT} Number of days in the month of date
     */
    daysInMonth(date) {
        var r = new Date(date.getYear(), date.getMonth()+1, 0).getDate();
        return parseInt(r);
    }
    /**
     * Count the number of days between two dates
     *
     * @param {DATE} date1 Start date for period
     * @param {DATE} date2 End date for period
     * @param {BOOLEAN} wantDiff True to allow negative numbers in result
     * @returns {INT} Number of days in period between date1 and date2
     */
    daysInPeriod(date1, date2, wantDiff) {
        var one_day	= 1000*60*60*24;
        date1.setHours(12); date1.setMinutes(0); date1.setSeconds(0); date1.setMilliseconds(0);
        date2.setHours(12); date2.setMinutes(0); date2.setSeconds(0); date2.setMilliseconds(0);
        var result	= parseInt((date2.getTime() - date1.getTime()) / one_day);
        if (wantDiff) return result;
        else return Math.abs(result);
    }
    /**
     * Add some days to a date object
     *
     * @param {DATE} date Original date
     * @param {INT} days Number of days to add to the date
     * @returns {DATE} The resulting date object, normalized to noon (12:00:00.000)
     */
    addDaysToDate(date, days) {
        var mdate = new Date(date.getTime());
        mdate.setTime( mdate.getTime()+ days * 1000*60*60*24 );
        mdate.setHours(12); mdate.setMinutes(0); mdate.setSeconds(0); mdate.setMilliseconds(0);
        return mdate;
    }
    /**
     * Add some hours to a date object
     *
     * @param {DATE} date Original date
     * @param {INT} hours Number of hours to add to the date
     * @returns {DATE} The resulting date object, normalized (xx:00:00.000)
     */
    addHoursToDate(date, hours) {
        var mdate = new Date(date.getTime());
        mdate.setTime( mdate.getTime()+ hours * 1000*60*60 );
        mdate.setMinutes(0); mdate.setSeconds(0); mdate.setMilliseconds(0);
        return mdate;
    }
}
