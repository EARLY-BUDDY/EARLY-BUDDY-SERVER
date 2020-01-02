var admin = require("firebase-admin");
const firebaseConfig = require("../config/firebaseConfig");
var schedule = require('node-schedule');

const alarm = {
    setSchedule: async (scheduleIdxs, registerToken, dates) => {
        const scheduleNames = [];
        for (var i = 0; i < dates.length; i++) {
            let year = Number(dates[i].split(' ')[0].split('-')[0]);
            let month = Number(dates[i].split(' ')[0].split('-')[1]);
            let day = Number(dates[i].split(' ')[0].split('-')[2]);
            let hour = Number(dates[i].split(' ')[1].split(':')[0]);
            let min = Number(dates[i].split(' ')[1].split(':')[1]);
            var date = new Date(year, month, day, hour, min);
            const scheduleModel = await schedule.scheduleJob(date, function () {
                alarm.message(registerToken, dates[i].length - i);
            });
            await scheduleNames.push(scheduleModel.name);
        }
        console.log("scheduledJobs  : ", schedule.scheduledJobs);
        return scheduleNames;
    },
    message: async (registerToken, alarmFlag) => {
        var title = "얼리버디";
        var body = "이제 남은 버스는 " + alarmFlag + "대야! ";

        admin.initializeApp(firebaseConfig);
        if (alarmFlag == 1) {
            body = body + "이제 긴장해!";
        } else if (alarmFlag == 2) {
            body = body + "슬슬 준비해!";
        } else if (alarmFlag == 3) {
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
        }).catch(function (error) {
            console.log('보내기 실패 : ', error);
        });
    },
    deleteAlarm: async (deleteAlarms) => {
        console.log(deleteAlarms);
        for (jobName in deleteAlarms) {
            var job = 'jobList.' + jobName;
            eval(job + '.cancel()');
        }
    }
}

module.exports = alarm;
