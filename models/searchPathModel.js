const odsayAPI = require('../module/odsayAPI');
const ak = require('../config/appkey');
const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statCode = require('../module/statusCode');
const pool = require('../module/pool');

module.exports = {
    searchPath: async (SX, SY, EX, EY, SearchPathType) => {
        let result = await odsayAPI.searchPubTransPath(SX, SY, EX, EY, SearchPathType);
        if (result === undefined) {
            return({
                code: statCode.BAD_REQUEST,
                json: resUtil.successFalse(resMsg.FIND_PATH_FAILED)
            })
        }
        let path = result.path;
        if(path === undefined) {
            return({
                code: statCode.BAD_REQUEST,
                json: resUtil.successFalse(resMsg.FIND_PATH_FAILED)
            })
        }
        let totalWalkTime = 0;
        let count = 0;
        for (var i = 0; i < path.length; i++) {
            for (var j = 0; j < path[i].subPath.length; j++) {
                if (path[i].subPath[j].trafficType === 3) {
                    totalWalkTime += path[i].subPath[j].sectionTime;
                    continue;
                }
                else {
                    count += 1;
                }
                path[i].subPath[j].clicked = false;
                path[i].subPath[j].lane = path[i].subPath[j].lane[0];
            }
            path[i] = {
                pathType: path[i].pathType,
                totalTime: path[i].info.totalTime,
                totalPay: path[i].info.payment,
                transitCount: count-1,
                totalWalkTime: totalWalkTime,
                subPath: path[i].subPath,
            }
            totalWalkTime = 0;
            count = 0;
        }
        path.sort((a,b)=>{return a.totalTime< b.totalTime?-1 : a.totalTime > b.totalTime? 1: 0});
        path[0].leastTotalTime = 1;
        path.sort((a,b)=>{return a.transitCount< b.transitCount?-1 : a.transitCount > b.transitCount? 1: 0});
        path[0].leastTransitCount = 1;
        path.sort((a,b)=>{return a.totalWalkTime< b.totalWalkTime?-1 : a.totalWalkTime > b.totalWalkTime? 1: 0});
        path[0].leastTotalWalkTime = 1;
        for(var k = 0 ; k < path.length ; k++) {
            let temp = 0;
            if(path[k].leastTotalTime === 1) {
                temp = path[0];
                path[0] = path[k];
                path[k] = temp;
            }
            else if(path[k].leastTransitCount === 1) {
                temp = path[1];
                path[1] = path[k];
                path[k] = temp;
            }
            else if(path[k].leastTotalWalkTime === 1) {
                temp = path[2];
                path[2] = path[k];
                path[k] = temp;
            }
        }
        result = {
            subwayCount: result.subwayCount,
            subwayBusCount: result.subwayBusCount,
            path: path
        }
        return({
            code: statCode.OK,
            json: resUtil.successTrue(resMsg.FIND_PATH_COMPLETE, result)
        });
        


    }
}