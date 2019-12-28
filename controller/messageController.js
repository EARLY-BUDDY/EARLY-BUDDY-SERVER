const firebaseUtil = require('../module/firebase');
const util = require('../module/responseUtil');
const responseMessage = require('../module/resMsg');
const statusCode = require('../module/statusCode');

module.exports = {
    send: async (req, res) => {
        const { registerToken, alarmFlag } = req.body;
        console.log("registerToken : ", registerToken);
        console.log("alarmFlag : ", alarmFlag);
        if(!registerToken || !alarmFlag ) {
            const missValue = Object.entries({registerToken, alarmFlag})
            .filter(it => it[1] == undefined).map(it => it[0]).join(',');
            res.status(statusCode.BAD_REQUEST)
            .send(util.successFalse(statusCode.BAD_REQUEST, missValue +'에 해당하는 '+responseMessage.NULL_VALUE));
            return;
        }
        if ( alarmFlag < 0 || alarmFlag > 3) {
            res.status(statusCode.BAD_REQUEST).send(util.successFalse(statusCode.BAD_REQUEST, responseMessage.WRONG_FLAG));
            return;
        }
        try {
            firebaseUtil.message(registerToken, alarmFlag);
            res.status(statusCode.OK).send(util.successTrue(statusCode.OK, responseMessage.SEND_MESSAGE_SUCCESS));
        } catch (err) {
            console.log('[messageController.js] ', err);
            res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.successFalse(responseMessage.INTERNAL_SERVER_ERROR));
        };
    }
}