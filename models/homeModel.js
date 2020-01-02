const pool = require('../module/pool');

module.exports = {
    getUserSchedules : async (userIdx, currentTime) => {
        const getUserScheduleQuery = `SELECT s.scheduleIdx, s.scheduleStartTime
                                From schedules s 
                                INNER JOIN usersSchedules us ON s.scheduleIdx = us.scheduleIdx
                                WHERE us.userIdx = '${userIdx}'` // user에게 달려s있는 캘린더 idx들 가져오기
        return await pool.queryParam_Arr(getUserScheduleQuery, [currentTime,userIdx])
        .catch((err) => {
            console.log('getUserSchedule err : ' + err)
        })
    },
    getScheduleSummary : async (scheduleIdx) => {
        const getScheduleSummaryQuery = `SELECT s.scheduleIdx, s.scheduleName, s.scheduleStartTime, s.endAddress
                                        From schedules s
                                        WHERE s.scheduleIdx = '${scheduleIdx}'`
        return await pool.queryParam_Arr(getScheduleSummaryQuery, [scheduleIdx])
        .catch((err) => {
            console.log('getScheduleSummary err : '+ err)
        })
    },
    getScheduleNotice : async (scheduleIdx) => {
        const getScheduleNoticeTimeQuery = `SELECT sn.noticeTime, sn.arriveTime
                                        From schedulesNotices sn
                                        WHERE sn.scheduleIdx = '${scheduleIdx}'
                                        ORDER BY sn.arriveTime DESC`
        return await pool.queryParam_Arr(getScheduleNoticeTimeQuery, [scheduleIdx])
        .catch((err) => {
            console.log('getScheduleNoticeTime err : '+ err)
        })
    },
    getScheduleFirstTrans : async (scheduleIdx) => {
        const getScheduleFirstTransQuery =  `SELECT d.detailIdx, d.trafficType, d.subwayLane, d.busNo, d.busType, d.detailStartAddress
                                                From details d
                                                INNER JOIN pathsDetails pd ON d.detailIdx = pd.detailIdx
                                                INNER JOIN schedulesPaths sp ON pd.pathIdx = sp.pathIdx
                                                WHERE sp.scheduleIdx = '${scheduleIdx}'`
        return await pool.queryParam_Arr(getScheduleFirstTransQuery, [scheduleIdx])
        .catch((err) =>{
            console.log('getScheduleFirstTrans err : '+err)
        })
    }
}