const jwt = require('./jwt');
const responseUtil = require('../module/responseUtil');
const statusCode = require('../module/statusCode');
const resMsg = require('../module/resMsg');

const authUtil = {
    //middlewares
    //미들웨어로 token이 있는지 없는지 확인하고
    //token이 있다면 jwt.verify함수를 이용해서 토큰 hash를 확인하고 토큰에 들어있는 정보 해독
    //해독한 정보는 req.decoded에 저장하고 있으며 이후 로그인 유무는 decoded가 있는지 없는지를 통해 알 수 있음
    checkToken: async (req, 
        res, next) => {
        var token = req.headers.jwt
        if (!token) {
            return res.json(responseUtil.successFalse(statusCode.BAD_REQUEST, resMsg.EMPTY_TOKEN))
        }
        const user = jwt.verify(token);
        if (user == this.TOKEN_EXPIRED) {
            return res.json(responseUtil.successFalse(statusCode.UNAUTHORIZED, resMsg.EXPIRED_TOKEN))
        }
        if (user == this.TOKEN_INVALID) {
            return res.json(responseUtil.successFalse(statusCode.UNAUTHORIZED, resMsg.INVALID_TOKEN))
        }
        if (user.idx == undefined) {
            return res.json(responseUtil.successFalse(statusCode.UNAUTHORIZED, resMsg.INVALID_TOKEN))
        }
        req.decoded = user;
        next();
    }
}
module.exports = authUtil