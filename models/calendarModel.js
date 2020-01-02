const pool = require('../module/pool');
const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statCode = require('../module/statusCode');

module.exports = {
    getCalendarSchedules : async (userIdx, year, month) =>{

        /*
        var startTime;
        var endTime;

        year *= 1;
        month *= 1;
        
        var prevYear;
        var prevMonth;
        var nextYear;
        var nextMonth;

        if(month == '1'){
            startTime = (year-1) + '-12-01';
            endTime = year +'-2-28';
            prevYear = year-1;
            prevMonth = 12;
            nextYear = year;
            nextMonth = 2;
        }else if(month == '12'){
            startTime = year + '-11-01';
            endTime = (year *1 + 1) + '-01-31';
            prevYear = year;
            prevMonth = 11;
            nextYear = year+1;
            nextMonth = 1;
        }else{
            startTime = year + '-' + (month-1) + '-' + '01';
            endTime = year + '-' + (month +1) + '-' + '31';
            
            prevYear = year;
            prevMonth = month;
            nextYear = year;
            nextMonth = month;
        }*/

        var startTime = year + '-' + month + '-'+'01';
        var endTime = year + '-' + month + '-'+'31';

        const getCalendarSchedulesQuery = `SELECT s.scheduleIdx, s.scheduleName, s.scheduleStartTime, s.endAddress
                                            From schedules s 
                                            
                                            INNER JOIN usersSchedules us ON s.scheduleIdx = us.scheduleIdx
                                            WHERE us.userIdx = '${userIdx}' AND date_format(s.scheduleStartTime, '%Y-%m-%d') BETWEEN '${startTime}' AND '${endTime}'`

        var schedules = await pool.queryParam_Arr(getCalendarSchedulesQuery, [startTime]);
        var data = {
            year,
            month,
            schedules
        }
        return({
            code: statCode.OK,
            json: resUtil.successTrue(resMsg.GET_SCHEDULE_SUCCESS, data)
        });
    }

}