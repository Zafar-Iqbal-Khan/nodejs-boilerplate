const express = require('express');
const router = express.Router();

const { runValidation } = require('../validators');
const { authenticate } = require('../middleware/authurize');
const {
     getUserProfile ,
     updateUserDetails,
     
    } = require('../controller/User');
require('dotenv').config()

router.get("/user-profile",authenticate,getUserProfile);
router.post("/update-user-details",authenticate,updateUserDetails);

module.exports = router;