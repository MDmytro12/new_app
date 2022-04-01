const {Router} = require('express');
const router = Router();
const SendFreqModel = require("../models/send-freq.model");
const SendPelengModel = require("../models/send-peleng.model");
const ConsoleModel = require("../models/console.model");
const {check , validationResult} = require("express-validator");
const ERRORS = require('../constants/error')
const {Types} = require("mongoose")

router.post( "/get-all-freq" , async (req , res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            error: ERRORS.ERROR_PARAMS
        })
    }

    try{

        let result = await SendFreqModel.find({isActive: true})

        res.status(200).json({
            result
        })

    }catch(e){
        return res.status(400).json({
            error: ERRORS.ERROR_SERVER
        })
    }

} )

router.post( '/send-freq' ,
    [
                check("freq" , "Error 1").isFloat({ min : 0  }) ,
                check("from" , "Error 2").isString().isLength({ min : 6 , max : 30 })
            ] , async (req, res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            error: ERRORS.ERROR_PARAMS
        })
    }

    const {freq , from } = req.body ;

    try{
        const resultInsert = await SendFreqModel.insertMany([
            {
                freq ,
                fromName: from ,
                sendedDate: Date.now(),
                isActive: true
            }
        ])

        return res.status(200).json({
            id: resultInsert[0]._id
        })

    }catch(e){
        return res.status(400).json({
            error: ERRORS.ERROR_DB_INSERT
        })
    }
} )

router.post( '/send-peleng' ,
    [
                check("peleng" , "Error 1").isFloat({ min : 0  }) ,
                check("from" , "Error 2").isString().isLength({ min : 6 , max : 30 }),
                check('toFreq' , "Error 3").isFloat({min:0}),
                check("freqId" , "Error 4").isString()
            ] ,
    async (req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({
                error: ERRORS.ERROR_PARAMS
            })
        }

        const {peleng , from , toFreq , freqId} = req.body ;

        try{
           const resultInsert = await SendPelengModel.insertMany([
                {
                    peleng ,
                    fromName: from ,
                    sendedDate: Date.now(),
                    toFreq ,
                    requestFreq: Types.ObjectId(freqId)
                }
            ])

            await SendFreqModel.updateOne({ _id : freqId }  , {
                isActive: false
            } )

            return res.status(200).json({
                id: resultInsert[0]._id
            })
        }catch(e){
            return res.status(400).json({
                error: ERRORS.ERROR_DB_INSERT
            })
        }
}
)

module.exports = router