var express = require('express');
var router = express.Router();
const alarm = require('../module/alarm');
const users = require('../models/userModel');
var moment = require('moment');

router.get('/', async(req,res)=>{
    let deviceToken =( await users.getDeviceToken(req.query.userIdx))[0].deviceToken;
    await alarm.setSchedule(deviceToken, moment().add(9, 'hours').add(5, 'seconds'), 1);
});

module.exports = router;