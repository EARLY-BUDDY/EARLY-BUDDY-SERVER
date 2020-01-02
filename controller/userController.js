const statusCode = require('../module/statusCode');
const resMsg = require('../module/resMsg');
const responseUtil = require('../module/responseUtil');
const User = require('../models/userModel');
const encrypt = require('../module/encryption');
const express = require('express');


module.exports = {
    //1. 로그인
    signin : async (req,res) =>{
        const {userId, userPw, deviceToken} = req.body;
        if(!userId || !userPw || !deviceToken){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.NULL_VALUE)); 
        }
        try{
            const {code, json} = await User.signin(userId, userPw)
            await User.setDeviceToken(userId, deviceToken);
            res.status(code).send(json)
        } catch (err) {
            await res.status(statusCode.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    },
    //2. 닉네임 설정
    setUserName : async (req,res) =>{
        const userIdx = req.decoded.idx;
        const {userName}= req.body;
        if(!userName){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(`userName ${resMsg.NULL_VALUE}`));
        }
        const checkNameResult = await User.checkName(userName);
        if (!checkNameResult ){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.ALREADY_NAME)); 
        } 
        try{
            const {code, json} = await User.setUserName(userName,userIdx);
            return res.status(code).send(json);
        } catch (err) {
            return await res.status(statusCode.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    },
    //3. 자주가는 장소 설정
    setFavorite : async (req,res) =>{
        const {favoriteInfo, favoriteCategory, favoriteLongitude, favoriteLatitude}= req.body;
        const userIdx = req.decoded.idx;
        if(!favoriteInfo||!favoriteCategory||!favoriteLongitude||!favoriteLatitude){
            const missParameters = await Object.entries({favoriteInfo,favoriteCategory,favoriteLongitude,favoriteLatitude}).filter(it=>it[1]==undefined).map(it=>it[0]).join(',');
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(`favoriteIdx ${missParameters} ${resMsg.NULL_VALUE}`));
        }
        try{
            const {code, json} = await User.setFavorite(favoriteInfo, favoriteCategory, favoriteLongitude, favoriteLatitude,userIdx);
            return await res.status(code).send(json);
        } catch (err) {
            return await res.status(statusCode.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    },
    //4. 회원가입
    signup : async (req,res) =>{
        const {userId, userPw} = req.body;
        const missParameters = await Object.entries({userId, userPw}).filter(it=>it[1]==undefined).map(it=>it[0]).join(',');
        if(!userId || !userPw){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(`${resMsg.NULL_VALUE} ${missParameters}`));
        }
        const checkIdResult = await User.checkId(userId);
        if (!checkIdResult ){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.ALREADY_ID)); 
        } 
        try{
            const {hashed, salt} = await encrypt.encrypt(userPw)
            const {code, json} =await User.signup(userId, hashed, salt)
            res.status(code).send(json);
        }catch(err) {
            await res.status(statusCode.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    }
}

