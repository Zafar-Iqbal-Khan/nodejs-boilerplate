const { check } = require('express-validator');

exports.userLoginValidator = [
    check('mobile_number')
        .exists()
        .withMessage('mobile_number required!'),
    check('pass_or_otp')
        .exists()
        .withMessage('password required!'),
    check('method')
        .exists()
        .withMessage('method is required!')
];
exports.userLoginEmailValidator = [
    check('email')
        .exists()
        .withMessage('email required!'),
    check('password')
        .exists()
        .withMessage('password required!'),
    
];

exports.userRegistrationValidator = [
    check('first_name_v')
        .exists()
        .withMessage('Name required!'),
    check('mobile_number_v')
        .exists()
        .withMessage('mobile_number required!')
];

exports.loginOtpValidator = [
    check('mobile_number')
        .exists()
        .withMessage('mobile_number required!')
];

exports.verifyRegistrationOtpValidator = [
    check('mobile_number')
        .exists()
        .withMessage('mobile_number required!'),
    check('OTP')
        .exists()
        .withMessage('OTP is required!')
];