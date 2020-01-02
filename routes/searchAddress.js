var express = require('express');
var router = express.Router();
const searchAddress = require('../controller/searchAddressController')

router.get('/', searchAddress.searchAddress);

module.exports = router;