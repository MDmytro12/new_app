const app = require("express")();
const mongoose = require("mongoose");
const config = require("config");
const bodyParser = require("body-parser")
const PORT = process.env.PORT || 9000 ;

app.use(bodyParser.json())

app.use('/login' , require('./route/login.route'))
app.use('/process' , require('./route/process.route'))

async function start(){
    try{
        await mongoose.connect(config.get("mongoURL") , {
            useNewUrlParser: true ,
            useUnifiedTopology: true
        })

        app.listen(PORT , (err) => {
            if(err){
                console.log("Server launch with error!")
                return;
            }

            console.log("Server was launched! Port : " , PORT)
        })
    }
    catch(e){
        console.log("Error connection to MongoDB!" , e)
    }
}

start()