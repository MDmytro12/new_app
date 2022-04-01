const {Router} = require("express");
const router = Router();
const {validationResult , check} = require("express-validator");
const ERRORS = require('../constants/error');
const UserModel = require("../models/auth.model")

router.post( '/' ,
    [
                check('login' , "Error 1").isLength({min: 6 , max: 30}) ,
                check('password' , "Error 1").exists().isLength({min: 6 , max: 25})
            ] ,
    async (req , res) => {
        console.log("Request" , req.body)
        try{
            const err = validationResult(req) ;

            if(!err.isEmpty()){
                return res.status(400).json({
                    message: ERRORS.ERROR_UNCORRECT_LOGIN_DATA
                })
            }

            const {login , password} = req.body ;

            let checkResult = await UserModel.findOne({
                login
            })

            if(!checkResult){
                return res.status(400).json({
                    error: ERRORS.ERROR_UNEXIST_USER
                })
            }

            checkResult = await UserModel.findOne({ login , password });

            if(!checkResult){
                return res.status(400).json({
                    error: ERRORS.ERROR_UNCORRECT_LOGIN_DATA
                })
            }

            res.status(200).json({
                loginData: {
                    id: checkResult._id ,
                    username: checkResult.username
                }
            })

        }
        catch(e){
            return res.status(500).json( {error: ERRORS.ERROR_SERVER})
        }
} )

module.exports = router;