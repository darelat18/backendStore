const mongoose = require("mongoose");
const verifyUser = mongoose.Schema({
    userId:String,
    OTP:String,
    createdAt:Date,
    expiresAt:Date,
})

const Verify = mongoose.model('verify', verifyUser)
module.exports = Verify