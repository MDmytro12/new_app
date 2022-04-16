const {Schema , model } = require("mongoose");

const schema = new Schema({
    freq: {
        type: Number ,
        required: true ,
        min: 0
    },
    fromName: {
        type: String ,
        required: true
    },
    sendedDate:{
        type: Date ,
        default: Date.now()
    },
    isActive:{
        type: Boolean,
        required: true,
        default: false
    } ,
    userSeen: [
        Schema.Types.ObjectId
    ]
})

module.exports = model("send-freq" , schema)