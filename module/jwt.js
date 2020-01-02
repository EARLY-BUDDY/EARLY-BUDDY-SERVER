
/*1. header jwt 토큰의 유형이나 사용된 해시 알고리즘의 정보
2. payload 클라이언트에 대한 정보
3. signature header에서 지정한 알고리즘과 secret key 로 header 와 payload를 담는다.*/
const randToken = require('rand-token');
const jwt = require('jsonwebtoken');
const {secretOrPrivateKey} = require('../config/secretKey');
const options = {
    algorithm: "HS256",
    expiresIn: 60*60*24*30 // 30일
};
module.exports = {
    sign: (user) =>{
        const payload = {
            idx: user.userIdx
        };
        const result = {
            token: jwt.sign(payload, secretOrPrivateKey, options),
            refreshToken: randToken.uid(256)
        };
        return result;
    },
    verify: (token) =>{
        let decoded;
        try{
            decoded = jwt.verify(token, secretOrPrivateKey);
        } catch(err){
            if(err.message ==='jwt expired'){
                console.log('expired token');
                return -3;
            } else if (err.message === 'invalid token'){
                console.log('invalid token');
                return -2;
            }else{
                console.log("invalid token");
                return -2;
            }
        }
        return decoded;
    },
    refresh : (user)=>{
        const payload = {
            idx: user.idx
        };
        return jwt.sign(payload, secretOrPrivateKey, options);
    }
}

const jwt = require('jsonwebtoken');
const secretKey = require('../config/secretKey').key;
//jwt 모듈화
module.exports = {
    //jwt 발급후 토큰 리턴
    sign: function (ID) {
        const options = {
            algorithm: "HS256",
            expiresIn: 60 * 60 * 24 * 30 //30 days
        };
        const payload = {
            userIdx: ID
        };
        let token = jwt.sign(payload, secretKey, options);
        return token;
    },
    //jwt 검증
    //검증이 성공할 경우 사용자 정보 리턴(ID값)
    //검증이 실패할 경우 -1 리턴
    //에러날 경우 -2 리턴
    verify: function (token) {
        let decoded;
        let err;
        try {
            decoded = jwt.verify(token, secretKey);
        }
        catch (err) {
            if (err.message == 'jwt must be provided') { // 비회원이라 토큰이 없을 때
                return -1;
            }
            else {
                return -2;
            }
        }
        return decoded.userIdx;
    }
};
