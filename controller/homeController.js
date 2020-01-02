const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statusCode = require('../module/statusCode');
const schedules = require('../models/homeModel');

module.exports = {
    getHomeSchedule: async(req, res) => {
        let userIdx = req.query.userIdx;
        if(!userIdx){
            res.status(statusCode.BAD_REQUEST).send(resUtil.successFalse(resMsg.NULL_VALUE));
            return;
        }else{

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
            // moment는 app.js에서 쓰거나, index.js에서 한번만 선언
            var moment = require('moment');
            require('moment-timezone');
            console.log(moment().format('YYYY-MM-DD HH:mm:ss'));

            // user에게 할당된 스케쥴 받아와서 일정시간이 지금 시간보다 뒤에 있는 일정이 있는지 검사
            var userSchedule = await schedules.getUserSchedules(userIdx, moment);
            var scheduleIdx = -1;
            for(let i = 0; i<userSchedule.length; i++){
                let scheduleDate = moment(userSchedule[i].scheduleStartTime, 'YYYY-MM-DD HH:mm:ss');
                var currentDate = moment(new Date());
                if(scheduleDate - currentDate > 0 && scheduleDate.diff(currentDate, 'day') < 8){
                    scheduleIdx = userSchedule[i].scheduleIdx;
                    break;
                }
            } // -> sql로 바꾸고 싶음
            // todo: gap을 diff로 바꾸기

            // todo: 반복문을 map, filter 등으로 처리

            // 해당 일정이 없으면 null 반환
            if(scheduleIdx == -1 || userSchedule.length == 0){
                res.status(statusCode.OK).send(resUtil.successTrue(resMsg.GET_HOME_SCHEDULE_SUCCESS, null));
                return;
            }else{
                // 해당 일정이 있으면, 일정 요약 정보와 알림 정보 가져오기
                var scheduleSummary = await schedules.getScheduleSummary(scheduleIdx);
                var scheduleNoticeList = await schedules.getScheduleNotice(scheduleIdx);
            
                console.log('scheduleNoticeList : ' + scheduleNoticeList);
                // 남아있는 교통수단(trans) 개수 가져오기
                for(var transCount = 0; transCount < scheduleNoticeList.length; transCount++){
                    let tempArriveDate = moment(scheduleNoticeList[transCount].arriveTime, 'YYYY-MM-DD HH:mm:ss');
                    if(currentDate - tempArriveDate > 0) break;
                }

                // 화면에 보여줘야할 trans의 idx
                var currentTransIdx = scheduleNoticeList.length - transCount - 1;
                // 위 for문의 break에서 안 걸린 경우는, 현재시간이 모든 trans의 도착 시간 보다 전인 경우
                if(transCount == scheduleNoticeList.length)
                    currentTransIdx = transCount -1;
                var nextTransArriveTime = null;
                if(transCount > 1 )
                    nextTransArriveTime = scheduleNoticeList[currentTransIdx-1].arriveTime;

                var scheduleSummaryData = scheduleSummary[0];
                // notice 시간보다 더 전이면 ready는 false, schedule summary return 
                var noticeTime = moment(scheduleNoticeList[currentTransIdx].noticeTime, 'YYYY-MM-DD HH:mm:ss');
                if(noticeTime > currentDate|| transCount < 0){
                    var data = {
                        ready : false,
                        scheduleSummaryData
                    };
                    res.status(statusCode.OK).send(resUtil.successTrue(resMsg.GET_HOME_SCHEDULE_SUCCESS, data));
                    return;
                }
                var scheduleTransList = await schedules.getScheduleFirstTrans(scheduleIdx);

                var firstTransIdx = -1;
                for(let i = 0; i < scheduleTransList.length; i++){
                    if(scheduleTransList[i].trafficType != 3){
                        firstTransIdx = i;
                        break;
                    }
                } // -> find로 하면 더 좋다.

                if(firstTransIdx == -1){
                    res.status(statusCode.BAD_REQUEST).send(resUtil.successFalse(resMsg.FIND_TRANS_FAILED));
                    return;
                }else{

                    // TODO: 실시간 버스 정보 받아오기

                    var data = {
                        ready : true,
                        lastTransCount : transCount,
                        arriveTime : scheduleNoticeList[currentTransIdx].arriveTime,
                        firstTrans : scheduleTransList[firstTransIdx],
                        nextTransArriveTime: nextTransArriveTime,
                        scheduleSummaryData
                    }
                    res.status(statusCode.OK).send(resUtil.successTrue(resMsg.GET_HOME_SCHEDULE_SUCCESS, data));
                    return;
                }
            }
        }
    }
}
