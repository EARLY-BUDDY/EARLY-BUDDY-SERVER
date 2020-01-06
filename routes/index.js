var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/users', require('./users'));
router.use('/schedules', require('./schedules'));
router.use('/calenders', require('./calenders'));
router.use('/searchPath', require('./searchPath'));
router.use('/home', require('./home'));
router.use('/searchAddress', require('./searchAddress'));
router.use('/testAlarm' , require('./testAlarm'));

module.exports = router;
