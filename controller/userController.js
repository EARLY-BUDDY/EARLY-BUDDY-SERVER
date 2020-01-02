const statusCode = require('../module/statusCode');
const resMsg = require('../module/resMsg');
const responseUtil = require('../module/responseUtil');
const User = require('../models/userModel');
const encrypt = require('../module/encryption');
const express = require('express');


module.exports = {
    //로그인
    signin : async (req,res) =>{
        const {userId, userPw, deviceToken} = req.body;
        //아이디나 비번이 입력이 안됐다면
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
    setUserName : async (req,res) =>{
        const userIdx = req.decoded.idx;
        const {userName}= req.body;
        if(!userName){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(`userName ${resMsg.NULL_VALUE}`));
        }
        //닉네임 중복 체크
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
    setFavorite : async (req,res) =>{
        console.log(userIdx);
        const {favoriteInfo,favoriteCategory,favoriteLongitude,favoriteLatitude}= req.body;
        for(i = 0;i<favoriteCategory.length;i++){
            const {favorite} = (favoriteInfo[i], favoriteCategory[i], favoriteLongitude[i], favoriteLatitude[i]);
            await userModel.INSERT({favorite});
        }
        console.log("req body : ",req.body);
        
        if(!favoriteInfo||!favoriteCategory||!favoriteLongitude||!favoriteLatitude){
            const missParameters = await Object.entries({favoriteInfo,favoriteCategory,favoriteLongitude,favoriteLatitude}).filter(it=>it[1]==undefined).map(it=>it[0]).join(',');
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(`favoriteIdx ${missParameters} ${resMsg.NULL_VALUE}`));
        }
        try{
            const {code, json} = await User.setUserFavorite(favoriteInfo,favoriteCategory,favoriteLongitude,favoriteLatitude,userIdx);
            console.log(code);
            console.log(json);
            return res.status(code).send(json);
        } catch (err) {
            return await res.status(statusCode.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    },
    signup : async (req,res) =>{
        const {userId, userPw} = req.body;
        const missParameters = await Object.entries({userId, userPw}).filter(it=>it[1]==undefined).map(it=>it[0]).join(',');
        if(!userId || !userPw){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(`${resMsg.NULL_VALUE} ${missParameters}`));
        }
        // 아이디 중복 체크
        const checkIdResult = await User.checkId(userId);
        if (!checkIdResult ){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.ALREADY_ID)); 
        } 
        // 비밀번호 암호화 
        try{
            const {hashed, salt} = await encrypt.encrypt(userPw)
            const {code, json} =await User.signup(userId, hashed, salt)
            res.status(code).send(json);
        }catch(err) {
            await res.status(statusCode.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    }
}

