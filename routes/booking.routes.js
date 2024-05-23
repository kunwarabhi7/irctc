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

const getStationID = (city) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT StationID FROM Stations WHERE LOWER(City) = LOWER(?)';
        db.query(query, [city], (err, result) => {
            if (err) {
                console.error('Error retrieving station ID:', err);
                return reject(err);
            }
            if (result.length === 0) {
                console.error(`Station not found for city: ${city}`);
                return reject('Station not found');
            }
            resolve(result[0].StationID);
        });
    });
};


bookingRouter.post('/', async(req, res) => {
    const { UserID, TrainID, BookingDate, TravelDate, SourceCity, DestinationCity, ClassType, Status, Passengers } = req.body;

    // Check all required fields
    if (!UserID || !TrainID || !BookingDate || !TravelDate || !SourceCity || !DestinationCity || !ClassType || !Status || !Passengers || Passengers.length === 0) {
        return res.status(400).json({ error: 400, message: 'All required fields must be filled' });
    }

    const SourceStationID = await getStationID(SourceCity);
    const DestinationStationID = await getStationID(DestinationCity);

    console.log(`SourceStationID: ${SourceStationID}, DestinationStationID: ${DestinationStationID}`); // Logging for debugging


    // Fetch fare from database
    const fareSql = 'SELECT Fare FROM TrainFares WHERE TrainID = ? AND SourceStationID = ? AND DestinationStationID = ? AND ClassType = ?';
    db.query(fareSql, [TrainID, SourceStationID, DestinationStationID, ClassType], (err, fareResult) => {
        if (err) {
            console.error('Database error fetching fare:', err);
            return res.status(500).json({ error: 500, message: 'Database error fetching fare', details: err.message });
        }

        if (fareResult.length === 0) {
            return res.status(400).json({ error: 400, message: 'Fare not found' });
        }

        const farePerPassenger = fareResult[0].Fare;

        // available seat code
        const seatSql = 'SELECT AvailableSeats, TotalSeats FROM Seats WHERE TrainID = ? AND ClassType = ?';
db.query(seatSql, [TrainID, ClassType], (err, seatResult) => {
    if (err) {
        console.error('Database error fetching seat numbers:', err);
        return res.status(500).json({ error: 500, message: 'Database error fetching seat numbers', details: err.message });
    }

    const availableSeats = seatResult[0].AvailableSeats;
    const totalSeats = seatResult[0].TotalSeats;

    if (availableSeats < Passengers.length) {
        return res.status(400).json({ error: 400, message: 'Not enough available seats' });
    }

            // Insert booking code
            const bookingSql = 'INSERT INTO Bookings (UserID, TrainID, BookingDate, TravelDate, SourceStationID, DestinationStationID, ClassType, TotalFare, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const totalFare = farePerPassenger * Passengers.length;
    db.query(bookingSql, [UserID, TrainID, BookingDate, TravelDate, SourceStationID, DestinationStationID, ClassType, totalFare, Status], (err, bookingResult) => {
        if (err) {
            console.error('Database error inserting booking:', err);
            return res.status(500).json({ error: 500, message: 'Database error inserting booking', details: err.message });
        }

        const BookingID = bookingResult.insertId;

        // Generate seat numbers 
        const startSeatNumber = totalSeats - availableSeats + 1;

        // Insert passengers with assigned seat numbers
        const passengerSql = 'INSERT INTO Passengers (BookingID, PassengerName, Age, Gender, SeatNumber) VALUES (?, ?, ?, ?, ?)';
        for (let i = 0; i < Passengers.length; i++) {
            const passenger = Passengers[i];
            const seatNumber = startSeatNumber + i;
            db.query(passengerSql, [BookingID, passenger.PassengerName, passenger.Age, passenger.Gender, seatNumber], (err) => {
                if (err) {
                    console.error('Database error inserting passenger:', err);
                    return res.status(500).json({ error: 500, message: 'Database error inserting passenger', details: err.message });
                }
            });
        }

        // Decrease available seats
        const updateSeatsSql = 'UPDATE Seats SET AvailableSeats = AvailableSeats - ? WHERE TrainID = ? AND ClassType = ?';
        db.query(updateSeatsSql, [Passengers.length, TrainID, ClassType], (err) => {
            if (err) {
                console.error('Database error updating available seats:', err);
                return res.status(500).json({ error: 500, message: 'Database error updating available seats', details: err.message });
            }

            res.status(200).json({ success: 200, message: 'Booking successful', BookingID })
                });
            });
        });
    });
});










export default bookingRouter;
