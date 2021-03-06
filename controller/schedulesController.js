const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statCode = require('../module/statusCode');
const pool = require('../module/pool');
const schedules = require('../models/schedulesModel');
const odsayAPI = require('../module/odsayAPI');
const timeCalc = require('../module/timeCalc');
const users = require('../models/userModel');
var moment = require('moment');
const alarm = require('../module/alarm');

module.exports = {
    addSchedule: async (req, res) => {
        let body = req.body;
        let path = JSON.parse(body.path);
        let subPath = path.subPath;
        let startTime = body.scheduleStartDay + ' ' + body.scheduleStartTime;
        let startTm = moment(startTime, 'YYYY-MM-DD HH:mm')
        try {
            let addScheduleResult = await schedules.addSchedule(body.scheduleName, startTime, body.startAddress, body.startLongitude, body.startLatitude, body.endAddress, body.endLongitude, body.endLatitude, body.noticeMin, body.arriveCount);
            let addPathsResult = await schedules.addPaths(path.pathType, path.totalTime, path.totalPay, path.totalWalkTime, path.transitCount, subPath[1].startName);
            let deviceToken =( await users.getDeviceToken(body.userIdx))[0].deviceToken;
            for (var i = 0; i < subPath.length; i++) {
                if (subPath[i].trafficType === 1) {
                    console.log('arriveCount : ' + body.arriveCount);
                    let stopArray = subPath[i].passStopList.stations;
                    let addSubwayResult = await schedules.addSubway(1, subPath[i].distance, subPath[i].sectionTime, subPath[i].stationCount, subPath[i].lane.subwayCode, subPath[i].startName, subPath[i].startX, subPath[i].startY, subPath[i].endName, subPath[i].endX, subPath[i].endY, stopArray, addPathsResult.insertId);
                    if (addSubwayResult === false) throw ({ code: addBusResult.code, json: addBusResult.json });
                    if (i !== 1) continue;
                    let subTime = await timeCalc.subwayTime(startTm, stopArray[0].stationID, subPath[i].wayCode, body.noticeMin, body.arriveCount + 2, subPath[i].sectionTime);
                    console.log(subTime);
                    if (subTime.code === statCode.BAD_REQUEST) 
                    {
                        res.status(subTime.code).send(subTime.json);
                    };
                    for (var k = 0; k < body.arriveCount + 2; k++) {
                        if(body.noticeMin === 0) {
                            await schedules.addTime(moment(subTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), null , addScheduleResult.insertId);
                            console.log(k+1 + ' 번째 지하철 알림시간 0, 배차 시간만 추가 완료');
                        }
                        await schedules.addTime(moment(subTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), moment(subTime.noticeArr[k]).format('YYYY-MM-DD HH:mm'), addScheduleResult.insertId);
                        console.log(k + 1 + ' 번째 지하철 알림시간 추가 완료');
                    }
                    console.log('알림 울려야 하는 시간 : ' + moment(subTime.noticeArr[k]).format('YYYY-MM-DD HH:mm'));
                    let reqResult = await alarm.requestAlarm(k,moment(subTime.noticeArr[k]).format('YYYY-MM-DD HH:mm'), deviceToken);
                    if (addSubwayResult != true) {
                        throw ({ code: addSubwayResult.code, json: addSubwayResult.json });
                    }
                    console.log('지하철 경로 추가 컨트롤러 접근 완료, 경로 번호 : ' + Number(i + 1));
                }
                else if (subPath[i].trafficType === 2) {
                    let stopArray = subPath[i].passStopList.stations;
                    let addBusResult = await schedules.addBus(2, subPath[i].distance, subPath[i].sectionTime, subPath[i].stationCount, subPath[i].startName, subPath[i].startX, subPath[i].startY, subPath[i].endName, subPath[i].endX, subPath[i].endY, subPath[i].lane.busNo, subPath[i].lane.type, stopArray, addPathsResult.insertId);
                    if (addBusResult === false) throw ({ code: addBusResult.code, json: addBusResult.json });
                    if (i !== 1) continue;
                    let busTime = await timeCalc.busTime(subPath[i].lane.busNo, startTm, subPath[i].startName, body.arriveCount + 2, body.noticeMin, subPath[i].sectionTime)
                    console.log(busTime);
                    if (busTime.code === statCode.BAD_REQUEST) throw (busTime);
                    for (var k = 0; k < body.arriveCount + 2; k++) {
                        if(body.noticeMin === 0) {
                            await schedules.addTime(moment(busTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), null , addScheduleResult.insertId);
                            console.log(k+1 + ' 번째 버스 알림시간 0, 배차 시간만 추가 완료');
                            continue;
                        }
                        await schedules.addTime(moment(busTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), moment(busTime.noticeArr[k]).format('YYYY-MM-DD HH:mm'), addScheduleResult.insertId);
                        console.log(k + 1 + ' 번째 버스 알림시간 추가 완료');
                        let reqResult = await alarm.requestAlarm(k,moment(busTime.noticeArr[k]).format('YYYY-MM-DD HH:mm'), deviceToken);
                        console.log('알림 설정 완료!');
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
                console.log('=========================');
                console.log(body.weekdays);
                console.log(body.weekdays.length);
                console.log('=========================');
                for (var i = 0; i < body.weekdays.length; i++) {
                    await schedules.addWeekdays(body.weekdays[i], addScheduleResult.insertId);
                    console.log(i + ' 회차 요일'  +body.weekdays[i] + '추가중');
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
        if (getSchedulesResult.code == statCode.BAD_REQUEST) {
            res.status(getSchedulesResult.code).send(getSchedulesResult.json);
            return;
        }
        res.status(statCode.OK).send(resUtil.successTrue(resMsg.GET_SCHEDULE_SUCCESS, getSchedulesResult));
        return;
    },
    deleteSchedule: async (req, res) => {
        let scheduleIdx = req.query.scheduleIdx;
        if (!scheduleIdx) {
            return res.status(statCode.BAD_REQUEST).send(resUtil.successFalse('scheduleIdx에 해당하는 ' + resMsg.NULL_VALUE + '. 쿼리를 입력해주세요.'));
        }
        const result = await schedules.deleteSchedule(scheduleIdx);
        console.log('delete schedule complete!');
            res.status(statCode.OK).send(resUtil.successTrue(resMsg.DELETE_SCHEDULE_SUCCESS));
            return;
        
    },
    updateSchedule: async (req, res) => {
        let scheduleIdx = req.query.scheduleIdx;
        if (!scheduleIdx) {
            return res.status(statCode.BAD_REQUEST).send(resUtil.successFalse('scheduleIdx에 해당하는 ' + resMsg.NULL_VALUE + '. 쿼리를 입력해주세요.'));
        }
        let getSchedulesResult = await schedules.getSchedules(scheduleIdx);
        console.log('get schedule complete!');
        if (getSchedulesResult.length == 0) {
            return res.status(statCode.BAD_REQUEST).send(resUtil.successFalse('scheduleIdx에 해당하는 ' + resMsg.INVALID_VALUE + ' scheduleIdx값을 확인해주세요.'));
        } // ! 1st : body에서 받은 scheduleIdx로 DB 조회

        let body = req.body;
        let path = JSON.parse(body.path);
        let subPath = path.subPath;
        let startTime = body.scheduleStartDay + ' ' + body.scheduleStartTime;
        let startTm = moment(startTime, 'YYYY-MM-DD HH:mm')
        try {
            await schedules.deleteSchedule(scheduleIdx);
            let addScheduleResult = await schedules.addSchedule(body.scheduleName, startTime, body.startAddress, body.startLongitude, body.startLatitude, body.endAddress, body.endLongitude, body.endLatitude, body.noticeMin, body.arriveCount);
            let addPathsResult = await schedules.addPaths(path.pathType, path.totalTime, path.totalPay, path.totalWalkTime, path.transitCount, subPath[1].startName);
            
            for (var i = 0; i < subPath.length; i++) {
                if (subPath[i].trafficType === 1) {
                    let stopArray = subPath[i].passStopList.stations;
                    let addSubwayResult = await schedules.addSubway(1, subPath[i].distance, subPath[i].sectionTime, subPath[i].stationCount, subPath[i].lane.subwayCode, subPath[i].startName, subPath[i].startX, subPath[i].startY, subPath[i].endName, subPath[i].endX, subPath[i].endY, stopArray, addPathsResult.insertId);
                    if (addSubwayResult === false) throw ({ code: addBusResult.code, json: addBusResult.json });
                    if (i !== 1) continue;
                    
                    let subTime = await timeCalc.subwayTime(startTm, stopArray[0].stationID, subPath[i].wayCode, body.noticeMin, body.arriveCount, subPath[i].sectionTime);
                    if (subTime.code === statCode.BAD_REQUEST) throw (subTime);
                    for (var k = 0; k < body.arriveCount; k++) {
                        if(body.noticeMin === 0) {
                            await schedules.addTime(moment(subTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), null , addScheduleResult.insertId);
                            console.log(k+1 + ' 번째 지하철 알림시간 0, 배차 시간만 추가 완료');
                        }
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
                    let addBusResult = await schedules.addBus(2, subPath[i].distance, subPath[i].sectionTime, subPath[i].stationCount, subPath[i].startName, subPath[i].startX, subPath[i].startY, subPath[i].endName, subPath[i].endX, subPath[i].endY, subPath[i].lane.busNo, subPath[i].lane.type, stopArray, addPathsResult.insertId);
                    if (addBusResult === false) throw ({ code: addBusResult.code, json: addBusResult.json });
                    if (i !== 1) continue;
                    let busTime = await timeCalc.busTime(subPath[i].lane.busNo, startTm, subPath[i].startName, body.arriveCount, body.noticeMin, subPath[i].sectionTime)
                    if (busTime.code === statCode.BAD_REQUEST) throw (busTime);
                    for (var k = 0; k < body.arriveCount + 1; k++) {
                        if(body.noticeMin === 0) {
                            await schedules.addTime(moment(busTime.arriveArr[k]).format('YYYY-MM-DD HH:mm'), null , addScheduleResult.insertId);
                            console.log(k+1 + ' 번째 버스 알림시간 0, 배차 시간만 추가 완료');
                            continue;
                        }
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
            res.status(statCode.OK).send(resUtil.successTrue(resMsg.UPDATE_SCHEDULE_SUCCESS, addScheduleResult.insertId));

        }
        catch (exception) {
            console.log(exception);
            res.status(exception.code).send(exception.json);
        }
    },
}