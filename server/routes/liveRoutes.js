const express = require('express');
const router = express.Router();
const { getAllLiveRooms} = require('../controllers/liveController');
const protect = require('../middleware/protect');

//router.post('/createLiveRoom',protect,createLiveRoom);
router.get('/getAllLiveRooms',protect,getAllLiveRooms);

module.exports = router;
