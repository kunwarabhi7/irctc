import { Router } from "express";
import db from "../utils/db.js";

const bookingRouter = Router();

bookingRouter.get('/',(req,res)=>{
db.query("select * from Bookings", (err,data)=>{
    if(err) throw err;
    res.json({status:200 , data})
 })
} )


bookingRouter.get('/:userID', (req, res) => {

    const userID = parseInt(req.params.userID, 10);

    if (isNaN(userID) || userID <= 0) {
        return res.status(400).json({ error: 'Please enter a valid User ID' });
    }


    const sql = 'SELECT * FROM Bookings WHERE UserID = ?';

    db.query(sql, [userID], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length > 0) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({ error: 'No bookings found for the provided user ID' });
        }
    });
});

// booking 
bookingRouter.post('/', (req, res) => {
    const { UserID, TrainID, BookingDate, TravelDate, SourceStationID, DestinationStationID, ClassType, TotalFare, Status, Passengers } = req.body;

    // check all input are filled
    if (!UserID || !TrainID || !BookingDate || !TravelDate || !SourceStationID || !DestinationStationID || !ClassType || !TotalFare || !Status || !Passengers || Passengers.length === 0) {
        return res.json({ error: 400, message: 'All required fields must be filled' });
    }

    // check for passenger input are filled
    for (const passenger of Passengers) {
        if (!passenger.PassengerName || !passenger.Age || !passenger.Gender || !passenger.SeatNumber) {
            return res.json({error:400,message:"Please fill all passenger data fields"})
        }
    }

    const bookingSql = 'INSERT INTO Bookings (UserID, TrainID, BookingDate, TravelDate, SourceStationID, DestinationStationID, ClassType, TotalFare, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(bookingSql, [UserID, TrainID, BookingDate, TravelDate, SourceStationID, DestinationStationID, ClassType, TotalFare, Status], (err, result) => {
        if (err) {
            return res.status(500).send('Database Error');
        }

        const BookingID = result.insertId;

        for (const passenger of Passengers) {
            const passengerSql = 'INSERT INTO Passengers (BookingID, PassengerName, Age, Gender, SeatNumber) VALUES (?, ?, ?, ?, ?)';
            db.query(passengerSql, [BookingID, passenger.PassengerName, passenger.Age, passenger.Gender, passenger.SeatNumber], (err) => {
                if (err) {
                    return res.status(500).send('Database Error');
                }
            });
        }

        res.json({"success":200,message:'Booking successful'});
    });
});





export default bookingRouter;