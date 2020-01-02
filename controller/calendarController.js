const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statusCode = require('../module/statusCode');
const schedules = require('../models/calendarModel');

module.exports = {
    getCalendarSchedules : async(req, res) => {
        let userIdx = req.query.userIdx;
        let year = req.query.year;
        let month = req.query.month;
        if(!userIdx){
            res.status(statusCopl/de.BAD_REQUEST).send(resUtil.successFalse(resMsg.NULL_VALUE));
            return;
        }
        try {
            let schedule = await schedules.getCalendarSchedules(userIdx, year, month);
            if (schedule.code == statusCode.BAD_REQUEST) {
                res.status(schedule.code).send(schedule.json);
            }
            else {
                res.status(schedule.code).send(schedule.json);
            }

        }catch(err){
            console.log('calendar controller err ');
            console.log(err);
        }
    }
}