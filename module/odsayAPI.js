const request = require('request');
const ak = require('../config/appkey');

module.exports = {
    searchPubTransPath: (SX, SY, EX, EY, SearchPathType) => {
        return new Promise((resolve, reject) => {
            const options = {
                'uri': `https://api.odsay.com/v1/api/searchPubTransPathR?apiKey=${ak.odsay}&SX=${SX}&SY=${SY}&EX=${EX}&EY=${EY}&SearchPathType=${SearchPathType}`,
            }
            request(options, (err, result) => {
                if (err) reject (err);
                else {
                    resolve(JSON.parse(result.body).result);
                }
            })
        })
    },
    getSubwayArriveTime : (stationID, wayCode) => {
        return new Promise((resolve, reject)=> {
            const options = {
                'uri' : `https://api.odsay.com/v1/api/subwayTimeTable?apiKey=${ak.odsay}&stationID=${stationID}&wayCode=${wayCode}`
            }
            request(options, (err,result)=>{
                if(err) reject(err);
                else {
                    resolve(JSON.parse(result.body).result);
                }
            })
        })
    }
}