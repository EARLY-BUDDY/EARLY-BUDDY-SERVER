const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statusCode = require('../module/statusCode');
const schedules = require('../models/homeModel');
const scheduleModel = require('../models/schedulesModel');
const commonAPI = require('../module/commonAPI');
const seoulAPI = require('../module/seoulAPI');

module.exports = {
    getHomeSchedule: async (req, res) => {
        let userIdx = req.query.userIdx;
        if (!userIdx) {
            res.status(statusCode.BAD_REQUEST).send(resUtil.successFalse(resMsg.NULL_VALUE));
            return;
        } else {

            // try catch로 error 잡아주자~!~!!~

            /** logic **
             * 보여줄 스케쥴 받아오기
             * 1. 스케쥴 startTime이 현재 시간보다 뒤에 있는 스케쥴 한개 가져오기
             *      - 없으면 return 값이 null (CHECK)
             *      - 있으면 return 값이 있음
             * 2. 1-2인 경우에, 스케쥴 startTime이 
             *      - 5시간 전이 아니면 ready = false로 설정하고, scheduleName, scheduleStartTime, endAddress, idx return (CHECK)
             *      - 5시간 남았으면 해당 스케쥴에 달린 scheduleNotices의 noticeTime 값 가져오기 (CHECK)
             * 3. 2-2 시간이,
             *      - 아직 지나지 않았으면, ready = false로 설정하고, scheduleName, scheduleStartTime, endAddress, idx return (CHECK)
             *      - 같거나 지났으면, ready = true로 설정하고, 아래와 같은 데이터를 return
             *          => 몇대 남았는지: scheduleNotices의 arriveTime 과 현재 시간으로 계산
             *          => 버스 도착 시간: scheduleNotices - arriveTime
             *          => details[1] (1로 fix 박거나 trafficType이 보도가 아닌 것) - trafficType, subwayLane || busNo, detailStartAddress
             *          => schedules - scheduleName, scheduleStartTime, endAddress, idx
             */

            // 현재시간
            var moment = require('moment');
            require('moment-timezone');

            // user에게 할당된 스케쥴 받아와서 일정시간이 지금 시간보다 뒤에 있는 일정이 있는지 검사
            var userSchedule = await schedules.getUserSchedules(userIdx, moment);
            console.log('userSchedule size : ' + userSchedule.length)
            var scheduleIdx = -1;
            for (let i = 0; i < userSchedule.length; i++) {
                let scheduleDate = moment(userSchedule[i].scheduleStartTime, 'YYYY-MM-DD HH:mm:ss');
                var currentDate = moment(new Date());
                if (scheduleDate > currentDate && scheduleDate.diff(currentDate, 'day') < 8) {
                    scheduleIdx = userSchedule[i].scheduleIdx;
                    break;
                    //console.log('scheduleIdx ' + scheduleIdx);
                }
            }

            // todo: 반복문을 map, filter 등으로 처리

            // 해당 일정이 없으면 null 반환
            console.log('scheduleIdx : ' + scheduleIdx);
            console.log('userSchedule.length : ' + userSchedule.length);
            if (scheduleIdx == -1 || userSchedule.length == 0) {
                res.status(statusCode.OK).send(resUtil.successTrue(resMsg.NO_HOME_SCHEDULE, null));
                return;
            }

            // 해당 일정이 있으면, 일정 요약 정보와 알림 정보 가져오기
            var scheduleSummary = await schedules.getScheduleSummary(scheduleIdx);
            var scheduleNoticeList = await schedules.getScheduleNotice(scheduleIdx);

            console.log('스케쥴 이름' + scheduleSummary[0].scheduleName);
            console.log('스케줄 인덱스' + scheduleSummary[0].scheduleIdx);
            console.log('scheduleNoticeList size' + scheduleNoticeList.length)
            // 남아있는 교통수단(trans) 개수 가져오기
            for (var transCount = 0; transCount < scheduleNoticeList.length; transCount++) {
                let tempArriveDate = moment(scheduleNoticeList[transCount].arriveTime, 'YYYY-MM-DD HH:mm:ss');
                // arrive 시간이 지났으면 break;
                if (currentDate - tempArriveDate > 0) break;
            }

            // 화면에 보여줘야 할 trans의 idx. 찐막 포함 n개가 있다면 transCount = n+1이겠죠? 근데 보내줄 때는 n만 보내야 함.
            var currentTransIdx = (scheduleNoticeList.length - 1) - transCount + 1;

            // 위 for문의 break에서 안 걸린 경우는, 현재시간이 모든 trans의 도착 시간 보다 전인 경우
            if (transCount == scheduleNoticeList.length)
                currentTransIdx = transCount - 1; // 현재 시간과 제일 가까운거 가져오기
            var nextTransArriveTime = null;
            if (transCount > 1) // 남아 있는 교통 수단이 2개 이상이면, 다음 교통 수단 보내주기
                nextTransArriveTime = scheduleNoticeList[currentTransIdx - 1].arriveTime;
            else if (transCount == 1) { // 남아 있는 교통 수단이 1개면 걔는 찐막!
                nextTransArriveTime = scheduleNoticeList[0].arriveTime;
                console.log('찐막');
            }

            var scheduleSummaryData = scheduleSummary[0];
            // notice 시간보다 더 전이면 ready는 false, schedule summary return 

            // TODO: 실시간 버스 정보 받아오기

            // let scheduleInfo = await scheduleModel.getSchedules(scheduleIdx);
            // let subPath = scheduleInfo.path.subPath;
            // let busTimeArr = [];
            // for (var i = 0; i < subPath.length; i++) {
            //     if (subPath[i].trafficType === 2) { // ! 버스일 경우
            //         console.log('시작 장소 : ' + subPath[i].detailStartAddress);
            //         let getBusRouteListResult = await commonAPI.getBusRouteList(Number(subPath[i].busNo));
            //         if (getBusRouteListResult.length == 0) {
            //             console.log('no getBusRouteListResult');
            //             break;
            //         }
            //         console.log(getBusRouteListResult);
            //         if (getBusRouteListResult.length > 1) {
            //             let getStationByRouteResult = await commonAPI.getStationByRoute(Number(getBusRouteListResult[0].busRouteId[0]));
            //             console.log('1')
            //             console.log(getStationByRouteResult[j].stationNm[0]);
            //             console.log(subPath[i].detailStartAddress)
            //             //let getStationByRouteResult2 = await commonAPI.getStationByRoute(Number(getBusRouteListResult[1].busRouteId[0]));
            //             for (var j = 0; j < getStationByRouteResult.length; j++) {
            //                 if (getStationByRouteResult[j].stationNm[0] !== subPath[i].detailStartAddress) {
            //                     break;
            //                 }
            //                 console.log('여기1')
            //                     let busTimeResult = await commonAPI.getBusArriveTime(getStationByRouteResult[j].station[0], getStationByRouteResult[j].busRouteId[0], Number(getStationByRouteResult[j].seq[0]))
            //                     busTimeArr.push(busTimeResult[0].arrmsg1);
            //                     busTimeArr.push(busTimeResult[0].arrmsg2);
            //             }
            //             getStationByRouteResult = await commonAPI.getStationByRoute(Number(getBusRouteListResult[0].busRouteId[0]));
            //             console.log('2')
            //             console.log(getStationByRouteResult[j].stationNm[0]);
            //             console.log(subPath[i].detailStartAddress)
            //             for (var j = 0; j < getStationByRouteResult.length; j++) {
            //                 if (getStationByRouteResult[j].stationNm[0] !== subPath[i].detailStartAddress) {
            //                     break;
            //                 }
            //                 console.log('여기2')
            //                     let busTimeResult = await commonAPI.getBusArriveTime(getStationByRouteResult[j].station[0], getStationByRouteResult[j].busRouteId[0], Number(getStationByRouteResult[j].seq[0]))
            //                     busTimeArr.push(busTimeResult[0].arrmsg1);
            //                     busTimeArr.push(busTimeResult[0].arrmsg2);
            //             }
            //         }
            //         let getStationByRouteResult = await commonAPI.getStationByRoute(Number(getBusRouteListResult[0].busRouteId[0]));
            //             console.log('3')
            //             console.log(getStationByRouteResult[j].stationNm[0]);
            //             console.log(subPath[i].detailStartAddress)
            //             for (var j = 0; j < getStationByRouteResult.length; j++) {
            //                 if (getStationByRouteResult[j].stationNm[0] !== subPath[i].detailStartAddress) {
            //                     break;
            //                 }
            //                 console.log('여기1')
            //                     let busTimeResult = await commonAPI.getBusArriveTime(getStationByRouteResult[j].station[0], getStationByRouteResult[j].busRouteId[0], Number(getStationByRouteResult[j].seq[0]))
            //                     busTimeArr.push(busTimeResult[0].arrmsg1);
            //                     busTimeArr.push(busTimeResult[0].arrmsg2);
            //             }
            //     }

            //     // else if(subPath[i].trafficType === 1) {
            //     //     let subTimeResult = await seoulAPI.realtimeStArr(subPath[i].detailStartAddress);
            //     //     console.log(subTimeResult);
            //     // }
            // }
            //console.log(busTimeArr);
            // 찐막 시간이 지났으면 isGoing = true
            if (moment(scheduleNoticeList[1].arriveTime) < currentDate) {
                var data = {
                    ready: false,
                    isGoing: 1,
                    scheduleSummaryData
                };
                res.status(statusCode.OK).send(resUtil.successTrue(resMsg.GET_HOME_SCHEDULE_SUCCESS, data));
                return;
            }

            var noticeTime = moment(scheduleNoticeList[currentTransIdx].noticeTime, 'YYYY-MM-DD HH:mm:ss');
            // 제일 빠른 교통수단의 알림시간이 아직 지나지 않았을 때 ready = false
            if (noticeTime > currentDate || transCount < 0) {
                var data = {
                    ready: false,
                    isGoing: 0,
                    scheduleSummaryData,

                };
                res.status(statusCode.OK).send(resUtil.successTrue(resMsg.GET_HOME_SCHEDULE_SUCCESS, data));
                return;
            }
            var scheduleTransList = await schedules.getScheduleFirstTrans(scheduleIdx);

            // 도보가 아닌 첫번째 교통수단 찾기
            var firstTransIdx = -1;
            for (let i = 0; i < scheduleTransList.length; i++) {
                if (scheduleTransList[i].trafficType != 3) {
                    firstTransIdx = i;
                    break;
                }
            } // -> find로 하면 더 좋다.

            // 도보가 아닌 첫번째 교통수단이 없음
            if (firstTransIdx == -1) {
                res.status(statusCode.BAD_REQUEST).send(resUtil.successFalse(resMsg.FIND_TRANS_FAILED));
                return;
            }


            // 심정욱 짱짱 맨
            var data = {
                ready: true,
                isGoing: 0,
                lastTransCount: transCount - 1,
                arriveTime: scheduleNoticeList[currentTransIdx].arriveTime,
                firstTrans: scheduleTransList[firstTransIdx],
                nextTransArriveTime: nextTransArriveTime,
                scheduleSummaryData
            }
            res.status(statusCode.OK).send(resUtil.successTrue(resMsg.GET_HOME_SCHEDULE_SUCCESS, data));
            return;
        }
    }
}