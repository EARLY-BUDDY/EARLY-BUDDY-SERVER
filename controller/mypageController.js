/*const statusCode = require('../module/statusCode');
const resMsg = require('../module/resMsg');
const responseUtil = require('../module/responseUtil');
const MyPage = require('../models/myPageModel');
const express = require('express');

module.exports = {
    // 1. 닉네임 수정
    changeNickName  : async (req,res) =>{
        const userIdx = req.decoded.idx;
        const {userName} = req.body;
        if(!userName){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.NULL_VALUE)); 
        }
        try{
            const {code, json} = await MyPage.changeNickname(userName,userIdx)
            res.status(code).send(json)
        } catch (err) {
            await res.status(statusCode.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    },
    // 2. 아이디 출력
    getUserId : async (req,res) =>{
        const {userId} = req.body;
        if( userId){
            return await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.NULL_VALUE));
        }
        try{
            const {code, json} = await myPage.getUserId(userId)
            res.status(code).send(json)
        } catch (err){
            return await res.status(statusCode.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    },
    // 3. 비밀번호 바꾸기
    changePw : async (req, res) =>{
        const { userIdx, userPw} = req.body;
        if(!userPw){
            await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.NULL_VALUE));
        }
        try{
            const {code, json} = await myPage.changePw(userPw)
            res.status(code).send(json)
        } catch(err){
            await res.status(status.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    },
    // 4. 자주가는 장소 수정
    changeFavorite : async (req, res) =>{
        const userIdx = req.decoded.idx;
        const {changeCategory, changeInfo, changeLongtitude,changeLattitude} = req.body;
        if(! changeCategory||!changeInfo||!changeLongtitude||!changeLattitude){
            await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg.NULL_VALUE));
        }
        try{
            const {code, json} = await MyPage.changeFavorite(changeCategory, changeInfo, changeLongtitude,changeLattitude,userIdx)
            res.status(code).send(json)
        } catch (err){
            await res.status(status.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    },
    // 5. 회원 탈퇴
    withdrawal: async (req, res) =>{
        const {userIdx} =req.body;
        if(!userIdx){
            await res.status(statusCode.BAD_REQUEST).send(responseUtil.successFalse(resMsg));
        }
        try{
            const {code, json} = await myPage.withdrawal(userIdx)
            res.status(code).send(json)
        } catch(err){
            await res.status(status.INTERNAL_SERVER_ERROR).send(responseUtil.successFalse(resMsg.INTERNAL_SERVER_ERROR));
        }
    }

};

*/