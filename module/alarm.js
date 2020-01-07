var admin = require("firebase-admin");
const firebaseConfig = require("../config/firebaseConfig");
var schedule = require('node-schedule');
var moment = require('moment');
const request = require('request');


const alarm = {
    setSchedule: async (registerToken, noticeTime ,alarmFlag) => {
            let alarmTime = await schedule.scheduleJob(noticeTime, async function () {
                console.log('알림보내기 성공!');
                await alarm.message(registerToken, alarmFlag);
            })
    },
    message: async (registerToken, alarmFlag) => {
        var title = "얼리버디";
        var body = "이제 남은 버스는 " + alarmFlag + "대야! ";

        admin.initializeApp(firebaseConfig);
        if (alarmFlag == 1) {
            body = body + "이제 긴장해!";
        } else if (alarmFlag == 2) {
            body = body + "슬슬 준비해!";
        } else if (alarmFlag >= 3) {
            body = body + "천천히 해~";
        } else if (alarmFlag == 0) {
            body = "이거 못타면 정말 지각이야!";
        }

        var options = {
            priority: 'high',
            timeToLive: 60 * 60 * 24 * 2
        };

        var payload = {
            notification: {
                title: title,
                body: body,
                sound: "default",
                click_action: "FCM_PLUGIN_ACTIVITY",
                icon: "fcm_push_icon"
            },
            data: {
                test: "test가 성공적이네요 ~~ "
            }
        };

        admin.messaging().sendToDevice(registerToken, payload, options).then(function (response) {
            console.log('성공 메세지!' + response);
            return response
        })
        .catch(function (error) {
            console.log('보내기 실패 : ', error);
        });
    },
    deleteAlarm: async (deleteAlarms) => {
        console.log(deleteAlarms);
        for (jobName in deleteAlarms) {
            var job = 'jobList.' + jobName;
            eval(job + '.cancel()');
        }
    },
    requestAlarm : (alarmFlag, noticeTime, deviceToken)=> {
        return new Promise((resolve,reject)=>{
            const options = {
                uri : 'http://15.164.70.24:3457/scheduler/getNoticeTime',
                form : {
                    alarmFlag : alarmFlag,
                    noticeTime : noticeTime,
                    deviceToken : deviceToken
                }
            }
            request.post(options, (err, result)=>{
                if(err) console.log(err)
                else {
                    resolve(result.body);
                }
            })
        })
    }
}

module.exports = alarm;
