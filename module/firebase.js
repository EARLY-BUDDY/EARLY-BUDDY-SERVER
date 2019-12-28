var admin = require("firebase-admin");
const firebaseConfig = require("../config/firebaseConfig");
const responseMessage = require("../module/resMsg");
const statusCode = require("../module/statusCode");
const util = require('../module/responseUtil');

module.exports = {
    message: async (target_token, alarmFlag) => {
        var title = "얼리버디";
        var body = "이제 남은 버스는 "+alarmFlag+"대야! ";
        
        admin.initializeApp(firebaseConfig);
        if( alarmFlag == 1 ) {
            body = body + "이제 긴장해!";
        } else if ( alarmFlag == 2 ) {
            body = body + "슬슬 준비해!";
        } else if ( alarmFlag == 3 ) {
            body = body + "천천히 해~";
        } else if ( alarmFlag == 0 ) {
            body = "이거 못타면 정말 지각이야!";
        }
        // Set the message as high priority and have it expire after 24 hours.
        var options = {
            priority: 'high',
            timeToLive: 60 * 60 * 24
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

        admin.messaging().sendToDevice(target_token, payload, options).then(function (response) {
            console.log('성공 메세지!' + response);
        }).catch(function (error) {
            console.log('보내기 실패 : ', error);
        });
    }
}
 