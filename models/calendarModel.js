const pool = require('../module/pool');
const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statCode = require('../module/statusCode');

module.exports = {
    getCalendarSchedules : async (userIdx, year, month) =>{

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