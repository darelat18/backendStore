const express = require("express")
const {registerUser, verifyUser, resendOTP, loginUser, forgotPassword, resetPassword, changePassword, authenticateUser,}  = require("../Controller/userController");
const router = express.Router()

router.post('/register', registerUser) // register user
router.post('/verify', verifyUser) // verify user
router.post('/resend', resendOTP) // resend OTP
router.post('/login', loginUser) // login user
router.post('/forgot', forgotPassword) // forgot password
router.post('/resetPassword', resetPassword) // reset password
router.put('/change', authenticateUser, changePassword) // change password

module.exports = router