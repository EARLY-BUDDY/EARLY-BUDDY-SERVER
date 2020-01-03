var express = require('express');
var router = express.Router();
const authUtil  =require('../module/authUtil');
const UserController = require('../controller/userController');


router.post('/signup', UserController.signup);
router.post('/signin', UserController.signin);
router.get('/checkId', UserController.checkId);
router.post('/setUserName',authUtil.checkToken, UserController.setUserName);
router.post('/setFavorite', authUtil.checkToken,UserController.setFavorite);
router.get('/getFavorite', authUtil.checkToken, UserController.getFavorite);

module.exports = router;