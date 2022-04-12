const {Router} = require('express');
const router = Router();
const dateFns = require('date-fns')
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
            ] ,
    async (req, res) => {
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

        await ConsoleModel.insertMany([
            {
                requestFreq: Types.ObjectId(resultInsert[0]._id),
                requestPeleng: null
            }
        ])

        console.table([
            {
                "Frequency value" : freq ,
                "Sended from" : from ,
                "Date of sending" : dateFns.format(new Date(Date.now()) , "dd/MM/yyyy")
            }
        ]);

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

            // await SendFreqModel.updateOne({ _id : freqId }  , {
            //     isActive: false
            // } )

            await ConsoleModel.insertMany([{
                 requestFreq: null ,
                 requestPeleng: Types.ObjectId(resultInsert[0]._id)
            }])

            console.table([
                {
                    "Peleng value" : peleng ,
                    "Give on frequency" : toFreq ,
                    "Sended from" : from ,
                    "Date of sending" : dateFns.format(new Date(Date.now()) , "dd/MM/yyyy")
                }
            ]);

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

router.post('/get-console' , async (req , res) => {
    try{
        let ress = await ConsoleModel.find({})
            .populate('requestFreq')
            .populate({
                path : 'requestPeleng' ,
                populate: {
                    path: "requestFreq"
            }}).exec();

        res.send(ress)
    }catch(e){
        res.status(400).json({
            error: ERRORS.ERROR_SERVER
        })
    }
} )

router.post( '/get-all-f-p' , async (req , res) => {
    try{
        const allFreq = await SendFreqModel.find({});
        const allPeleng = await SendPelengModel.find({}).populate({
          path : 'requestFreq'
        }).exec()

        let resultArray = [] ;
        let filteredArray = [];
        let filterSet = new Set();

        allFreq.forEach(
            i => {
                allPeleng.forEach( i_1 => {
                    if(i_1.toFreq === i.freq && i_1.requestFreq.sendedDate.toString() === i.sendedDate.toString()){
                        console.log("PUSHING")
                        resultArray.push({
                            freq: i.freq ,
                            freqId: i._id,
                            pelengId: i_1._id,
                            pelengInfo: {
                                fromName: i_1.fromName,
                                peleng: i_1.peleng
                            },
                            date: i_1.sendedDate
                        })
                    }
                } )
            }
        );

        resultArray.forEach( it =>  {
            if(!filterSet.has(it.freq)){
                let filterObject = {
                    ...it ,
                    pelengInfo: [
                    ]
                } ;

                filterSet.add(it.freq)

                resultArray.forEach( it_1 => {
                    if(it.freq === it_1.freq){
                        filterObject.pelengInfo.push(it_1.pelengInfo)
                    }
                } );

                filteredArray.push(filterObject)
            }
        } )

        res.status(200).json({
            result: filteredArray
        })

    }
    catch(e){
        res.status(400).json({
            error: ERRORS.ERROR_SERVER
        })
    }
} )

module.exports = router