const {Schema , model , Types} = require("mongoose")

const schema = new Schema({
    login: {
        type: String ,
        unique: true ,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    }
})

module.exports = model("user" ,schema )