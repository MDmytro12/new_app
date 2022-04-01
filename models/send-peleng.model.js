const { model , Schema } = require("mongoose");

const schema = new Schema({
    peleng: {
        type: Number ,
        required: true,
        min: 0
    },
    fromName: {
        type: String ,
        required: true
    },
    sendedDate: {
        type: Date ,
        default: Date.now()
    } ,
    toFreq: {
        type: Number ,
        required: true,
        min: 0
    },
    requestFreq: {
        type: Schema.Types.ObjectId ,
        ref: 'send-freq'
    }
})

module.exports = model('send-peleng' , schema)