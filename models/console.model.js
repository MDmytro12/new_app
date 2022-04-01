const {Schema , model} = require("mongoose");

const schema = new Schema({
    from: {
        type: String ,
        required: true
    },
    requestPeleng: {
        type: Schema.Types.ObjectId,
        ref: 'send-peleng'
    },
    requestFreq: {
        type: Schema.Types.ObjectId ,
        ref: "send-freq"
    }
})

module.exports = model("console" , schema)