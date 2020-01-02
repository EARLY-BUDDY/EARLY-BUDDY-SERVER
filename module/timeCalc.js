const commonAPI = require('./commonAPI');
const odsayAPI = require('./odsayAPI');
const statCode = require('./statusCode');
const resMsg = require('./resMsg');
const resUtil = require('./responseUtil');
module.exports = {
    busTime: async (busNo, startTm, stationName, arriveCount, noticeMin ,sectionTime) => {
        console.log('BUS FIRST');
        let getBusRouteListResult = await commonAPI.getBusRouteList(Number(busNo));
        console.log(getBusRouteListResult);
        if(getBusRouteListResult === undefined) {
            return({
                code: statCode.BAD_REQUEST,
                json: resUtil.successFalse(resMsg.FIND_BUS_TIME_FAILED)
            })
        }
        let busRouteId = 0;
        for (var k = 0; k < getBusRouteListResult.length; k++) {
            if (busNo == getBusRouteListResult[k].busRouteNm[0]) {
                busRouteId = Number(getBusRouteListResult[k].busRouteId[0]);
                break;
            }
        }//버스 노선 ID 구하기
        let busRouteInfo = await commonAPI.getBusRouteInfo(busRouteId);
        let routeTerm = Number(busRouteInfo[0].term[0]); //배차간격
        let getStationByNameResult = await commonAPI.getStationByName(stationName);
        let getBusTimeByStationResult = await commonAPI.getBusTimeByStation(getStationByNameResult[0].arsId[0], busRouteId);
        if (getBusTimeByStationResult === undefined) {
            return ({
                code: statCode.BAD_REQUEST,
                json: resUtil.successFalse(resMsg.FIND_BUS_TIME_FAILED)
            })
        }
        let firstBusHour = Number((getBusTimeByStationResult[0].firstBusTm[0].split(''))[0] + (getBusTimeByStationResult[0].firstBusTm[0].split(''))[1]);
        let firstBusMin = Number(((getBusTimeByStationResult[0].firstBusTm[0]).split(''))[2] + ((getBusTimeByStationResult[0].firstBusTm[0]).split(''))[3]);
        let lastBusHour = Number(((getBusTimeByStationResult[0].lastBusTm[0]).split(''))[0] + ((getBusTimeByStationResult[0].lastBusTm[0]).split(''))[1]);
        //let lastBusMin = Number(((getBusTimeByStationResult[0].lastBusTm[0]).split(''))[2] + ((getBusTimeByStationResult[0].lastBusTm[0]).split(''))[3]);
        let leastTm = startTm.subtract(sectionTime, 'm').toString();
        let arriveArr = [];
        let arriveArrRes = [];
        let noticeArrRes = [];

        if (moment(leastTm).hour() < firstBusHour && moment(leastTm).hour() > lastBusHour) {
            console.log('새벽이라 차 없어요');
        }
        if (moment(leastTm).hour() > firstBusHour && moment(leastTm).hour() < lastBusHour) {
            let tempBusTime = moment(leastTm).hour(firstBusHour).minute(firstBusMin);
            while (startTm.diff(tempBusTime, 'minutes') > routeTerm) {
                let newTime = tempBusTime.add(routeTerm, "m");
                arriveArr.push(newTime.toString());
            }
        }
        for (var l = 1; l <= arriveCount; l++) {
            arriveArrRes.push(moment(arriveArr[(arriveArr.length) - l]).toString());
            noticeArrRes.push(moment(arriveArr[(arriveArr.length) - l]).subtract(noticeMin, 'minutes').toString())
        }
        return({
            arriveArr : arriveArrRes,
            noticeArr : noticeArrRes
        })
    },
    subwayTime: async (startTm, stationID, wayCode, noticeMin, arriveCount, sectionTime) => {
        let leastTm = startTm.subtract(sectionTime, 'm').toString();
        console.log('least : ' + leastTm);
        let getSubwayArriveTimeResult = await odsayAPI.getSubwayArriveTime(stationID, wayCode);
        if (getSubwayArriveTimeResult === undefined) {
            return ({
                code: statCode.BAD_REQUEST,
                json: resUtil.successFalse(resMsg.FIND_SUBWAY_TIME_FAILED)
            })
        }
        let arriveArr = [];
        let noticeArr = [];
        let timeArray = [];
        console.log('SUBWAY FIRST');
        if (moment(leastTm).day() == 6) { //토요일
            if (getSubwayArriveTimeResult.SatList.down === undefined) {
                timeArray = getSubwayArriveTimeResult.SatList.up.time;
            }
            else {
                timeArray = getSubwayArriveTimeResult.SatList.down.time;
            }
        }
        else if (moment(leastTm) == 0) { //일요일
            if (getSubwayArriveTimeResult.SunList.down === undefined) {
                timeArray = getSubwayArriveTimeResult.SunList.up.time;
            }
            else {
                timeArray = getSubwayArriveTimeResult.SunList.down.time;
            }
        }
        else {
            if (getSubwayArriveTimeResult.OrdList.down === undefined) {
                timeArray = getSubwayArriveTimeResult.OrdList.up.time;
            }
            else {
                timeArray = getSubwayArriveTimeResult.OrdList.down.time;
            }
        }
        for (var k = 0; k < timeArray.length; k++) {
            //startTime 0 년도 1 월 2 일 3 몇시 4 몇분
            if (timeArray[k].Idx == moment(leastTm).hour()) {
                let minArr = timeArray[k].list.split(' ');
                for (var j = 0; j < minArr.length; j++) {
                    if (moment(leastTm).minute() > Number(minArr[j].split('(')[0])) {
                        arriveArr.push(moment(leastTm).minute(minArr[j].split('(')[0]).toString());
                        noticeArr.push((moment(leastTm).minute(minArr[j].split('(')[0]).subtract(noticeMin, 'minutes')).toString());
                    }
                    if(arriveArr.length === arriveCount) {
                        break;
                    }
                }
                if (arriveArr.length < arriveCount) {
                    minArr = timeArray[k - 1].list.split(' ');
                    for (var l = minArr.length - 1; l > minArr.length - 1 - arriveCount; l--) {
                        arriveArr.push(moment(leastTm).subtract(1, 'hours').minute(minArr[l].split('(')[0]).toString());
                        noticeArr.push((moment(leastTm).minute(minArr[j].split('(')[0]).subtract(noticeMin, 'minutes')).toString());
                    }
                }
            }
        }
        return({
            arriveArr : arriveArr,
            noticeArr : noticeArr
        })
    }
}