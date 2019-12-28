var express = require('express');
var router = express.Router();
const messageController = require('../controller/messageController');

router.post('/', messageController.send);

module.exports = router;