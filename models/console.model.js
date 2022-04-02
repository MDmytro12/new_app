const {Schema , model} = require("mongoose");

const schema = new Schema({
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