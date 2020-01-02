const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statCode = require('../module/statusCode');
const pool = require('../module/pool');
const schedules = require('../models/schedulesModel');
const odsayAPI = require('../module/odsayAPI');
const timeCalc = require('../module/timeCalc');
var moment = require('moment');
const alarm = require('../module/alarm');

module.exports = {
    addSchedule: async (req, res) => {
        let body = req.body;
        let subPath = body.path.subPath;
        let startTime = body.scheduleStartDay + ' ' + body.scheduleStartTime;
        let startTm = moment(startTime, 'YYYY-MM-DD HH:mm')
        try {
            let addScheduleResult = await schedules.addSchedule(body.scheduleName, startTime, body.startAddress, body.startLongitude, body.startLatitude, body.endAddress, body.endLongitude, body.endLatitude, body.noticeMin, body.arriveCount);
            let addPathsResult = await schedules.addPaths(body.path.pathType, body.path.totalTime, body.path.totalPay, body.path.totalWalkTime, body.path.transitCount);

            for (var i = 0; i < subPath.length; i++) {
                if (subPath[i].trafficType === 1) {
                    let stopArray = subPath[i].passStopList.stations;
                    let addSubwayResult = await schedules.addSubway(1, subPath[i].distance, subPath[i].sectionTime, subPath[i].stationCount, subPath[i].lane[0].subwayCode, subPath[i].startName, subPath[i].startX, subPath[i].startY, subPath[i].endName, subPath[i].endX, subPath[i].endY, stopArray, addPathsResult.insertId);
                    if (addSubwayResult === false) throw ({ code: addBusResult.code, json: addBusResult.json });
                    if (i !== 1) continue;
                    let subTime = await timeCalc.subwayTime(startTm, stopArray[0].stationID, subPath[i].wayCode, body.noticeMin, body.arriveCount, subPath[i].sectionTime);
                    if (subTime.code === statCode.BAD_REQUEST) throw (subTime);
                    for (var k = 0; k < body.arriveCount; k++) {
                        await schedules.addTime(moment(subTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), moment(subTime.noticeArr[k]).format('YYYY-MM-DD HH:mm'), addScheduleResult.insertId);
                        console.log(k + 1 + ' 번째 지하철 알림시간 추가 완료');
                    }
                    if (addSubwayResult != true) {
                        throw ({ code: addSubwayResult.code, json: addSubwayResult.json });
                    }
                    console.log('지하철 경로 추가 컨트롤러 접근 완료, 경로 번호 : ' + Number(i + 1));
                }
                else if (subPath[i].trafficType === 2) {
                    let stopArray = subPath[i].passStopList.stations;
                    let addBusResult = await schedules.addBus(2, subPath[i].distance, subPath[i].sectionTime, subPath[i].stationCount, subPath[i].startName, subPath[i].startX, subPath[i].startY, subPath[i].endName, subPath[i].endX, subPath[i].endY, subPath[i].lane[0].busNo, subPath[i].lane[0].type, stopArray, addPathsResult.insertId);
                    if (addBusResult === false) throw ({ code: addBusResult.code, json: addBusResult.json });
                    if (i !== 1) continue;
                    let busTime = await timeCalc.busTime(subPath[i].lane[0].busNo, startTm, subPath[i].startName, body.arriveCount, body.noticeMin, subPath[i].sectionTime)
                    if (busTime.code === statCode.BAD_REQUEST) throw (busTime);
                    for (var k = 0; k < body.arriveCount; k++) {
                        await schedules.addTime(moment(busTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), moment(busTime.noticeArr[k]).format('YYYY-MM-DD HH:mm'), addScheduleResult.insertId);
                        console.log(k + 1 + ' 번째 버스 알림시간 추가 완료');
                    }
                    console.log('버스 경로 추가 컨트롤러 접근 완료, 경로 번호 : ' + Number(i + 1));
                }
                else {
                    let addWalkResult = await schedules.addWalk(3, subPath[i].distance, subPath[i].sectionTime, addPathsResult.insertId);
                    if (addWalkResult == false) throw ({ code: addWalkResult.code, json: addWalkResult.json });
                    console.log('걷기 경로 추가 완료, 경로 번호 : ' + Number(i + 1));
                }
            } //stops ~ paths 추가
            if (body.weekdays !== undefined) {
                for (var i = 0; i < body.weekdays.length; i++) {
                    await schedules.addWeekdays(body.weekdays[i], addScheduleResult.insertId);
                }
            }
            await schedules.addUsersSchedules(body.userIdx, addScheduleResult.insertId);
            await schedules.addSchedulesPaths(addScheduleResult.insertId, addPathsResult.insertId);
            res.status(statCode.OK).send(resUtil.successTrue(resMsg.ADD_SCHEDULE_SUCCESS, addScheduleResult.insertId));
        }
        catch (exception) {
            console.log(exception);
            res.status(exception.code).send(exception.json);
        }
    },
    getSchedule: async (req, res) => {
        let scheduleIdx = req.query.scheduleIdx;
        if (!scheduleIdx) {
            return res.status(statCode.BAD_REQUEST).send(resUtil.successFalse('scheduleIdx에 해당하는 ' + resMsg.NULL_VALUE + '. 쿼리를 입력해주세요.'));
        }
        let getSchedulesResult = await schedules.getSchedules(scheduleIdx);
        console.log('get schedule complete!');
        if (getSchedulesResult.length == 0) {
            return res.status(statCode.BAD_REQUEST).send(resUtil.successFalse('scheduleIdx에 해당하는 ' + resMsg.INVALID_VALUE + ' scheduleIdx값을 확인해주세요.'));
        }
        res.status(statCode.OK).send(resUtil.successTrue(resMsg.GET_SCHEDULE_SUCCESS, getSchedulesResult));
    },
    deleteSchedule: async (req, res) => {
        let scheduleIdx = req.query.scheduleIdx;
        if (!scheduleIdx) {
            return res.status(statCode.BAD_REQUEST).send(resUtil.successFalse('scheduleIdx에 해당하는 ' + resMsg.NULL_VALUE + '. 쿼리를 입력해주세요.'));
        }
        const result = await schedules.deleteSchedule(scheduleIdx);
        console.log('delete schedule complete!');
        if (result[0].affectedRows == 0) {
            res.status(statCode.BAD_REQUEST).send(resUtil.successFalse(resMsg.NO_CHANGE));
        } else {
            res.status(statCode.OK).send(resUtil.successTrue(resMsg.DELETE_SCHEDULE_SUCCESS));
        }
    },
    updateSchedule: async (req, res) => {
        /**
         * !Logic
         * ? 1st : body에서 받은 scheduleIdx로 DB 조회
         *     * 1-1 : 결과가 없다면 리턴
         * ? 2nd : 경로 수정
         *     * 2-1 : body.path의 유무에 따라 실행
         *     * 2-2 : 실행할 경우 스케쥴-경로 관계테이블도 수정
         * ? 3rd : 요일 반복 수정
         *     * 3-1 : body.weekdays 의 유무에 따라 실행
         * ? 4nd : 유저-스케쥴 관계테이블 수정
         * 
         */
        let scheduleIdx = req.query.scheduleIdx;
        if (!scheduleIdx) {
            return res.status(statCode.BAD_REQUEST).send(resUtil.successFalse('scheduleIdx에 해당하는 ' + resMsg.NULL_VALUE + '. 쿼리를 입력해주세요.'));
        }
        let getSchedulesResult = await schedules.getSchedules(scheduleIdx);
        console.log('get schedule complete!');
        if (getSchedulesResult.length == 0) {
            return res.status(statCode.BAD_REQUEST).send(resUtil.successFalse('scheduleIdx에 해당하는 ' + resMsg.INVALID_VALUE + ' scheduleIdx값을 확인해주세요.'));
        }

        let body = req.body;
        let subPath = body.path.subPath;
        let startTm = moment(startTime, 'YYYY-MM-DD HH:mm')
        try {
            let updateScheduleResult = await schedules.updateSchedule(body.scheduleName, startTime, body.startAddress, body.startLongitude, body.startLatitude, body.endAddress, body.endLongitude, body.endLatitude, scheduleIdx);
            if (body.path !== undefined) {
                let updatePathsResult = await schedules.updatePaths(body.path.pathType, body.path.totalTime, body.path.totalPay, body.path.totalWalkTime, body.path.transitCount);
                for (var i = 0; i < subPath.length; i++) {
                    if (subPath[i].trafficType === 1) {
                        let stopArray = subPath[i].passStopList.stations;
                        let updateSubwayResult = await schedules.updateSubway(1, subPath[i].distance, subPath[i].sectionTime, subPath[i].stationCount, subPath[i].lane[0].subwayCode, subPath[i].startName, subPath[i].startX, subPath[i].startY, subPath[i].endName, subPath[i].endX, subPath[i].endY, stopArray, addPathsResult.insertId);
                        if (updateSubwayResult === false) throw ({ code: updateBusResult.code, json: updateBusResult.json });
                        if (i !== 1) continue;
                        let subTime = await timeCalc.subwayTime(startTm, stopArray[0].stationID, subPath[i].wayCode, body.noticeMin, body.arriveCount, subPath[i].sectionTime);
                        if (subTime.code === statCode.BAD_REQUEST) throw (subTime);
                        for (var k = 0; k < body.arriveCount; k++) {
                            await schedules.updateTime(moment(subTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), moment(subTime.noticeArr[k]).format('YYYY-MM-DD HH:mm'), updateScheduleResult.insertId);
                            console.log(k + 1 + ' 번째 지하철 알림시간 수정 완료');
                        }
                        if (updateSubwayResult != true) {
                            throw ({ code: updateSubwayResult.code, json: updateSubwayResult.json });
                        }
                        console.log('지하철 경로 수정 컨트롤러 접근 완료, 경로 번호 : ' + Number(i + 1));
                    }
                    else if (subPath[i].trafficType === 2) {
                        let stopArray = subPath[i].passStopList.stations;
                        let updateBusResult = await schedules.updateBus(2, subPath[i].distance, subPath[i].sectionTime, subPath[i].stationCount, subPath[i].startName, subPath[i].startX, subPath[i].startY, subPath[i].endName, subPath[i].endX, subPath[i].endY, subPath[i].lane[0].busNo, subPath[i].lane[0].type, stopArray, addPathsResult.insertId);
                        if (updateBusResult === false) throw ({ code: updateBusResult.code, json: updateBusResult.json });
                        if (i !== 1) continue;
                        let busTime = await timeCalc.busTime(subPath[i].lane[0].busNo, startTm, subPath[i].startName, body.arriveCount, body.noticeMin, subPath[i].sectionTime)
                        if (busTime.code === statCode.BAD_REQUEST) throw (busTime);
                        for (var k = 0; k < body.arriveCount; k++) {
                            await schedules.updateTime(moment(busTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), moment(busTime.noticeArr[k]).format('YYYY-MM-DD HH:mm'), updateScheduleResult.insertId);
                            console.log(k + 1 + ' 번째 버스 알림시간 수정 완료');
                        }
                        console.log('버스 경로 수정 컨트롤러 접근 완료, 경로 번호 : ' + Number(i + 1));
                    }
                    else {
                        let updateWalkResult = await schedules.updateWalk(3, subPath[i].distance, subPath[i].sectionTime, updatePathsResult.insertId);
                        if (updateWalkResult == false) throw ({ code: updateWalkResult.code, json: updateWalkResult.json });
                        console.log('걷기 경로 수정 완료, 경로 번호 : ' + Number(i + 1));
                    }
                    await schedules.updateSchedulesPaths(updateScheduleResult.insertId, updatePathsResult.insertId);
                } //stops ~ paths 수정
            }
            if (body.weekdays !== undefined) {
                for (var i = 0; i < body.weekdays.length; i++) {
                    await schedules.updateWeekdays(body.weekdays[i], updateScheduleResult.insertId);
                }
            }
            await schedules.updateUsersSchedules(body.userIdx, updateScheduleResult.insertId);
            res.status(statCode.OK).send(resUtil.successTrue(resMsg.UPDATE_SCHEDULE_SUCCESS, updateScheduleResult.insertId));
        }
        catch (exception) {
            console.log(exception);
            res.status(exception.code).send(exception.json);
        }
    },
}