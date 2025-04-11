const express = require('express')
const dotenv = require('dotenv').config()
const app = express()
const PORT = 5100
const mongodb = require('mongodb')
const mongoose = require('mongoose')
const cors = require('cors')
const router = require('../Routes/userRoute')


app.use(express.json())
app.use(cors())
app.use('/api',router)

app.get('/', (req,res)=>{
    res.send('welcome to the home page')
})

console.log('welcome to the email server');
app.get('/about',(req,res)=>{
    res.send('welcome to the about server')
})

mongoose.connect(process.env.USER)
.then(()=>{
    console.log('connected successfully');
    app.listen(PORT, ()=>{
        console.log(`server running on ${PORT}`)
    })
})
.catch((error)=>{
    console.log(error);
})
