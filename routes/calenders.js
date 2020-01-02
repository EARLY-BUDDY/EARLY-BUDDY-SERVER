var express = require('express');
var router = express.Router();
const calendarController = require('../controller/calendarController');

router.get('/', calendarController.getCalendarSchedules);

module.exports = router;