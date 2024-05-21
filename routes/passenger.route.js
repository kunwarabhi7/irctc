import { Router } from "express";
import db from "../utils/db.js";

const passengerRouter = Router();

passengerRouter.get("/",(req,res)=>{
    db.query("select * from Passengers", (err,data)=>{
        if(err) throw err;
        res.json({status:200, data})
    })
})

export default passengerRouter;