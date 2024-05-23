import { Router } from "express";
import db from "../utils/db.js";

const passengerRouter = Router();

passengerRouter.get("/",(req,res)=>{
    db.query("select * from Passengers", (err,data)=>{
        if(err) throw err;
        res.json({status:200, data})
    })
})

passengerRouter.get("/:bookingID", (req, res) => {
    const bookingID = parseInt(req.params.bookingID, 10);

    // Validate bookingID
    if (isNaN(bookingID) || bookingID <= 0) {
        return res.status(400).json({ status: 400, message: 'Invalid booking ID' });
    }

    const query = "SELECT * FROM Passengers WHERE BookingID = ?";
    db.query(query, [bookingID], (err, data) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ status: 500, message: 'Database error', details: err.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ status: 404, message: 'No passengers found for the given booking ID' });
        }

        res.status(200).json({ status: 200, data });
    });
});


export default passengerRouter;
