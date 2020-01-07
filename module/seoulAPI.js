const ak = require('../config/appkey').commonRealTime;
const request = require('request');
const urlencode = require('urlencode');

module.exports = {
    realtimeStArr :  (stName) => {
        return new Promise((resolve, reject)=>{
            let stationName = urlencode(stName);
            const options = {
                'uri' : `http://swopenAPI.seoul.go.kr/api/subway/${ak}/json/realtimeStationArrival/0/5/${stationName}`
            }
            request(options, (err, result)=>{
                if(err) reject(err);
                else {
                    resolve(result.body)
                }
            })
        })
    }
}