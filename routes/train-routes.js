import { Router } from "express";
import db from "../utils/db.js";

const trainRouter = Router();

trainRouter.get('/', (req, res) => {
    const sql = 'SELECT * FROM Trains';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

trainRouter.get('/:trainID/schedule', (req, res) => {
    const trainID = parseInt(req.params.trainID, 10);

    if (isNaN(trainID) || trainID <= 0) {
        return res.status(400).json({ error: 'Please enter a valid train ID' });
    }
    

    const sql = 'SELECT * FROM TrainSchedule WHERE TrainID = ?';

    db.query(sql, [trainID], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (result.length > 0) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({ error: 'Schedule not found for the provided train ID' });
        }
    });
});

//search a train
trainRouter.post('/search', (req, res) => {
    const { SourceStationID, DestinationStationID, TravelDate, ClassType } = req.body;

    // Check if all required fields are provided
    if (!SourceStationID || !DestinationStationID || !TravelDate || !ClassType) {
        return res.status(400).json({ error: 400, message: 'All required fields must be filled' });
    }

    // Query to find trains that match the search criteria
    const searchSql = `
        SELECT t.TrainID, t.TrainName, tf.Fare, s.AvailableSeats
        FROM Trains t
        JOIN TrainFares tf ON t.TrainID = tf.TrainID
        JOIN Seats s ON t.TrainID = s.TrainID AND tf.ClassType = s.ClassType
        WHERE tf.SourceStationID = ? 
          AND tf.DestinationStationID = ?
          AND tf.ClassType = ?
          AND s.ClassType = ?
          AND s.AvailableSeats > 0
    `;

    db.query(searchSql, [SourceStationID, DestinationStationID, ClassType, ClassType], (err, results) => {
        if (err) {
            console.error('Database error fetching trains:', err);
            return res.status(500).json({ error: 500, message: 'Database error fetching trains', details: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 404, message: 'No trains found for the given criteria' });
        }

        res.status(200).json({ success: 200, trains: results });
    });
});



trainRouter.get('/:trainID/fares', (req, res) => {
    const trainID = parseInt(req.params.trainID, 10);

    if (isNaN(trainID) || trainID <= 0) {
        return res.status(400).json({ error: 'Please enter a valid train ID' });
    }
    
     const sql = 'SELECT * FROM TrainFares WHERE TrainID = ?';

    db.query(sql, [trainID], (err, result) => {
        if (err) {
            res.status(500).json({
                success: false,
                message: 'An error occurred while fetching train fares.'
            });
        } else {
            if (result.length > 0) {
                res.status(200).json({
                    success: true,
                    message: 'Train fares fetched successfully.',
                    data: result
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'No fares found for this train ID.'
                });
            }
        }
    });
});





export default trainRouter;
