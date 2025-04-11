const mongoose = require('mongoose')


const storeSchema = mongoose.Schema(
    {
        username:{
            type:String,
            required:[true, "please input your username"],
            trim:true,
            unique:true,
        },
        email:{
            type:String,
            required:[true, "please input your email address"],
            trim:true,
            unique:true,
            match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "please input a valid email address"]
        },
        password:{
            type:String,
            required:[true, "please input your password"],
            trim:true,
            unique:true,
            minLength:[6, "password should be at least 6 characters"],
            MaxLength:[20, "password should not be more than 20 characters"],
        },
        isVerified:{
            type:Boolean,
            default:false
        }
    },
    {
        timestamps:true
    }
)

const User = mongoose.model('user', storeSchema)
module.exports = User