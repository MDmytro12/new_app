const {Router} = require('express');
const router = Router();
const dateFns = require('date-fns')
const SendFreqModel = require("../models/send-freq.model");
const SendPelengModel = require("../models/send-peleng.model");
const UserModel = require("../models/auth.model")
const ConsoleModel = require("../models/console.model");
const {check , validationResult} = require("express-validator");
const ERRORS = require('../constants/error')
const {Types} = require("mongoose")

router.post( "/get-all-freq" , [
            check("userId" , "Error 1").isString() ,
        ],
    async (req , res) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({
            error: ERRORS.ERROR_PARAMS
        })
    }

    const {userId} = req.body ;

    try{
        let result = await SendFreqModel.find({});
        let nowDate = Date.now() ;
        let oldDate = null ;

        result = result.filter( i => !i.userSeen.includes(userId) )
                        .filter( i => {
                            oldDate = new Date(i.sendedDate)
                            oldDate = oldDate.getTime();
                            if( (nowDate - oldDate) / (1000 * 60 * 60) > 1  ){
                                return false;
                            }
                            return true;
                        } );

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
                check("from" , "Error 2").isString().isLength({ min : 6 , max : 30 }),
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
                check("freqId" , "Error 4").isString(),
                check("userId" , "Error 3").isString()
            ] ,
    async (req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({
                error: ERRORS.ERROR_PARAMS
            })
        }

        const {peleng , from , toFreq , freqId , userId} = req.body ;

        console.log("User id : " , userId)

        try{

            let findedFreq = await SendFreqModel.findById(Types.ObjectId(freqId));

            await SendFreqModel.updateOne({_id: Types.ObjectId(freqId)} , {
                $set : {
                    userSeen: [
                        ...findedFreq.userSeen ,
                        userId
                    ]
                }
            } )

            const resultInsert = await SendPelengModel.insertMany([
                {
                    peleng ,
                    fromName: from ,
                    sendedDate: Date.now(),
                    toFreq ,
                    requestFreq: Types.ObjectId(freqId),
                }
            ])

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

        let nowDate = Date.now();
        let oldDate = null ;

        ress = ress.filter( i => {

            if(i.requestPeleng){
                oldDate = new Date(i.requestPeleng.sendedDate);
                if( (nowDate - oldDate.getTime()) / (1000 * 60 * 60) < 1  ){
                    return true
                }

                return false
            }

            if(i.requestFreq){
                oldDate = new Date(i.requestFreq.sendedDate);
                if( ( nowDate - oldDate.getTime()) / (1000 * 60 * 60) < 1  ){
                    return true
                }

                return false
            }

        } );

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
        let nowDate = Date.now();
        let oldDate = null ;
        let filterSet = new Set();

        allFreq.forEach(
            i => {
                oldDate = new Date(i.sendedDate);
                oldDate = oldDate.getTime();

                if((nowDate - oldDate)/(1000*60*60) < 1){
                    allPeleng.forEach( i_1 => {

                        if(i_1.requestFreq._id.toString() === i._id.toString()){

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
    } catch(e){
        res.status(400).json({
            error: ERRORS.ERROR_SERVER
        })
    }
} )

module.exports = router