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
/*module.exports = {
    sign: (user)=>{
        const options = {
            // 서명을 만들기 위해 사용된 알고리즘
            algorithm: "HS256",
            // 토큰의 유효기간을 지정.
            expiresIn: "1h"
        };
        const payload = {
            userIdx : user.userId
        };
        const result = {
            token : jwt.sign(payload, secretOrPrivateKey, options),
            refreshToken: randToken.uid(256)
        };
        return result;
    },
    verify:(token)=>{
        let decoded;
        try {
            decoded = jwt.verify(token, secretOrPrivateKey);
        }catch(err){
            if(err.message==="jwt expired"){
                console.log("expired token");
                return -3;
            }else if(err.message ==="invalid token"){
                console.log("invalid token");
                return -2;
            }else{
                console.log("invalid token");
                return -2;
            }
        }
        return decoded;
    },
    refresh: (user) =>{
        const payload = {
            idx : user.idx,
            pwd : user.pwd
        };
        return jwt.sign(payload, secretKeyOrPrivateKey, options);
    }
};

sign: (user) =>{
    const payload ={
        idx:user.idx,
        
    }}*/