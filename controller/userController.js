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
        if(!userId || !userPw ){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.NULL_VALUE)); 
        }
        try{
            const {code, json} = await User.signin(userId, userPw)
            if(code === statusCode.BAD_REQUEST) {
                return res.status(code).send(json)
            }
            let userName = (await User.getUserName(json.data.userIdx))[0].userName;
            console.log(userName);
            if(userName === undefined) {
                json.data.userName = ''
            }
            res.status(code).send(json);
            return;
        } catch (err) {
            console.log(err);
            return await res.status(statusCode.FAIL).send(responseUtil.successFalse('INTERNAL_SERVER_ERROR'));
        }
    },
    //2. 닉네임 설정
    setUserName : async (req,res) =>{
        const userIdx = req.decoded.idx;
        const {userName}= req.body;
        if(!userName){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(`userName ${resMsg.NULL_VALUE}`));
        }
        try{
            const {code, json} = await User.setUserName(userName,userIdx);
            return res.status(code).send(json);
        } catch (err) {
            return await res.status(statusCode.FAIL).send(responseUtil.successFalse('INTERNAL_SERVER_ERROR'));
        }
    },
    //3. 자주가는 장소 설정
    setFavorite : async (req,res) =>{
        const favoriteArr = req.body.favoriteArr;
        const userIdx = req.decoded.idx;
        if(!favoriteArr){
            return res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.NULL_VALUE));
        }
        try{
            for(var i = 0 ; i < favoriteArr.length ; i++) {
                if(favoriteArr[i].favoriteCategory === 0) { //* 집
                    favoriteArr[i].favoriteInfo = '집 : ' + favoriteArr[i].favoriteInfo;
                }
                else if(favoriteArr[i].favoriteCategory === 1) { //* 회사
                    favoriteArr[i].favoriteInfo = '회사 : ' + favoriteArr[i].favoriteInfo;
                }
                else if(favoriteArr[i].favoriteCategory === 2) {//* 학교
                    favoriteArr[i].favoriteInfo = '학교 : ' + favoriteArr[i].favoriteInfo;
                }
                else {
                    favoriteArr[i].favoriteInfo = '기타 : ' + favoriteArr[i].favoriteInfo;
                }
                //await User.setFavorite(favoriteArr[i].favoriteInfo, favoriteArr[i].favoriteCategory, favoriteArr[i].favoriteLongitude, favoriteArr[i].favoriteLatitude, userIdx);
            } 
            return res.status(statusCode.OK).send(responseUtil.successTrue(resMsg.SET_FAVORITE_SUCCESS));
        } catch (err) {
            return await res.status(statusCode.FAIL).send(responseUtil.successFalse('INTERNAL_SERVER_ERROR'));
        }
    },
    //4. 회원가입
    signup : async (req,res) =>{
        const {userId, userPw, deviceToken} = req.body;
        const missParameters = await Object.entries({userId, userPw}).filter(it=>it[1]==undefined).map(it=>it[0]).join(',');
        if(!userId || !userPw){
            console.log('입력되지 않은 값');
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(`${resMsg.NULL_VALUE} ${missParameters}`));
        }
        const checkIdResult = (await User.checkId(userId));
        if (!checkIdResult ){
            console.log('여긴가')
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.ALREADY_ID)); 
        } 
        try{
            const {hashed, salt} = await encrypt.encrypt(userPw)
            const {code, json} =await User.signup(userId, hashed, salt, deviceToken)
            res.status(code).send(json);
        }catch(err) {
            return await res.status(statusCode.FAIL).send(responseUtil.successFalse('INTERNAL_SERVER_ERROR'));
        }
    },
    // 5 : 아이디 중복체크
    checkId : async (req,res)=>{
        const {userId} = req.body
        if(userId === undefined) {
            res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.NULL_VALUE));
            return;
        }
        const checkIdResult = await User.checkId(userId);
        if(checkIdResult === false) {
            res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.ALREADY_ID));
            return;
        }
        return res.status(statusCode.OK).send(responseUtil.successTrue(resMsg.USABLE_ID));
    },
    // 6 : 자주 가는 장소 정보 가져오기
    getFavorite : async (req, res)=>{
        const userIdx = req.decoded.idx;
        console.log(userIdx);
        console.log(req.decoded);
        if(userIdx === undefined) {
            res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.NULL_VALUE));
            return;
        }
        let getFavoriteResult = await User.getFavorite(userIdx);
        if(getFavoriteResult.length === 0) {
            res.status(statusCode.OK).send(responseUtil.successTrue(resMsg.GET_FAVORITE_SUCCESS_NO_VALUE));
            return;
        }
        res.status(statusCode.OK).send(responseUtil.successTrue(resMsg.GET_FAVORITE_SUCCESS, getFavoriteResult));
        return;
    }
}

