const ak = require('../config/appkey').common;
const request = require('request');
const convert = require('xml2js')
const urlencode = require('urlencode');

module.exports = {
    getBusArriveTime : (stId, busRouteId, ord) => { //버스 실시간 도착정보
        return new Promise((resolve, reject)=> {
            const options = {
                'uri' : `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute?ServiceKey=${ak}&stId=${stId}&busRouteId=${busRouteId}&ord=${ord}`
            }
            request(options, (err, result)=>{
                if(err) reject(err)
                else {
                    convert.parseString(result.body, (err, result)=>{
                        //console.log(result.ServiceResult.msgBody[0].itemList)
                        resolve(result.ServiceResult.msgBody[0].itemList);
                    })
                }
            })
        })
    },
    getBusRouteList : (busNo) => { //버스 번호로 찾기
        return new Promise((resolve, reject)=>{
            const options  = {
                "uri" : `http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList?ServiceKey=${ak}&strSrch=${busNo}`
            }
            request(options, (err, result)=>{
                if(err) reject(err)
                else {
                    convert.parseString(result.body, (err, result)=>{
                        //console.log(result.ServiceResult.msgBody[0].itemList);
                        resolve(result.ServiceResult.msgBody[0].itemList);
                    })
                }
            })
        })
    },
    getBusRouteInfo : (busRouteId) => { //버스 경로 ID로 정보 조회
        return new Promise((resolve, reject)=>{
            const options  = {
                "uri" : `http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo?ServiceKey=${ak}&busRouteId=${busRouteId}`
            }
            request(options, (err, result)=>{
                if(err) reject(err)
                else {
                    convert.parseString(result.body, (err, result)=>{
                        //console.log(result.ServiceResult.msgBody[0].itemList);
                        resolve(result.ServiceResult.msgBody[0].itemList);
                    })
                }
            })
        })
    },
    getStationByRoute : (busRouteId) => { // 경로 ID 로 노선 경로 목록 조회
        return new Promise((resolve,reject)=>{
            const options = {
                "uri" : `http://ws.bus.go.kr/api/rest/busRouteInfo/getStaionByRoute?ServiceKey=${ak}&busRouteId=${busRouteId}`
            }
            request(options, (err, result)=>{
                if(err) reject(err)
                else {
                    convert.parseString(result.body, (err, result)=>{
                        resolve(result.ServiceResult.msgBody[0].itemList);
                    })
                }
            })
        })
    },
    getStationByName : (stSrch) => {
        return new Promise((resolve,reject)=>{
            let stationName = urlencode(stSrch);
            const options = {
                "uri" : `http://ws.bus.go.kr/api/rest/stationinfo/getStationByName?ServiceKey=${ak}&stSrch=${stationName}`
            }
            request(options, (err, result)=>{
                if(err) reject(err)
                else {
                    //console.log(result.body);
                    convert.parseString(result.body, (err, result)=>{
                        resolve(result.ServiceResult.msgBody[0].itemList);
                    })
                }
            })
        })
    },
    getBusTimeByStation : (arsId, busRouteId) => {
        return new Promise((resolve,reject)=>{
            const options = {
                "uri" : `http://ws.bus.go.kr/api/rest/stationinfo/getBustimeByStation?ServiceKey=${ak}&arsId=${arsId}&busRouteId=${busRouteId}`
            }
            request(options, (err, result)=>{
                if(err) reject(err)
                else {
                    convert.parseString(result.body, (err, result)=>{
                        resolve(result.ServiceResult.msgBody[0].itemList);
                    })
                }
            })
        })
    }

    
}