const kakaoAPI = require('../module/kakaoAPI');
const resUtil = require('../module/responseUtil');
const resMsg = require('../module/resMsg');
const statCode = require('../module/statusCode');

module.exports = {
    searchAddress: async (req, res) => {
        if(req.query.addr === undefined) {
            res.status(statCode.BAD_REQUEST).send(resUtil.successFalse(resMsg.NULL_VALUE));
            return;
        }
        let result = await kakaoAPI.find(req.query.addr);
        let keywordResult = await kakaoAPI.findByKeyword(req.query.addr);
        console.log('result 수 : ' + result.documents.length);
        console.log('keywordResult 수 : ' + keywordResult.documents.length);
        if (result.meta.total_count === 0 && keywordResult.meta.total_count === 0) {
            res.status(statCode.BAD_REQUEST).send(resUtil.successFalse(resMsg.FIND_ADDRESS_FAILED))
            return;
        }
        if (result.meta.total_count === 0) {;
            for (var i = 0; i < keywordResult.documents.length; i++) {
                keywordResult.documents[i] = {
                    placeName: keywordResult.documents[i].place_name,
                    addressName: keywordResult.documents[i].address_name,
                    roadAddressName: keywordResult.documents[i].road_address_name,
                    x: keywordResult.documents[i].x,
                    y: keywordResult.documents[i].y
                }
            }
            res.status(statCode.OK).send(resUtil.successTrue(resMsg.FIND_ADDRESS_COMPLETE, keywordResult.documents))
            return;
        }
        for (var i = 0; i < result.documents.length; i++) {
            console.log(result.documents[i]);
            if(result.documents[i].road_address == null) {
                result.documents[i] = {
                    addressName: result.documents[i].address.address_name,
                    roadAddressName: null,
                    x: result.documents[i].x,
                    y: result.documents[i].y
                }
                continue;
            }
            console.log('here');
            result.documents[i] = {
                addressName: result.documents[i].address.address_name,
                roadAddressName: result.documents[i].road_address.address_name,
                x: result.documents[i].x,
                y: result.documents[i].y
            }
        }
        res.status(statCode.OK).send(resUtil.successTrue(resMsg.FIND_ADDRESS_COMPLETE, result.documents))
        return;
    }
}