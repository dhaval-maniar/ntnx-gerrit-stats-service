//External Modules
const express = require('express');
require('dotenv/config');
const cors = require('cors')

//Local Modules
const membersRoute = require('./routes/membersRouter');

//Server Initialization
const app = express()
const port = process.env.PORT || 8000;

//Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: false}))

//Routes
app.use('/api/members', membersRoute);

//Server Listen
const server = app.listen(port, (err)=>{
    if(!err){
      console.log(`App listining on port ${port} - http://localhost:${port}`)
    }
})

module.exports = {app, server}