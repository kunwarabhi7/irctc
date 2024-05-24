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
            console.log(`StationID for ${city}:`, result[0].StationID); 
            resolve(result[0].StationID);
        });
    });
};


// Train route Search
trainRouter.post('/search', async (req, res) => {
    const { SourceCity, DestinationCity, TravelDate, ClassType } = req.body;

    // Check if all required fields are filled
    if (!SourceCity || !DestinationCity || !TravelDate) {
        return res.status(400).json({ error: 400, message: 'SourceCity, DestinationCity, and TravelDate are required' });
    }

    try {
        const SourceStationID = await getStationID(SourceCity);
        const DestinationStationID = await getStationID(DestinationCity);

        console.log(`SourceStationID: ${SourceStationID}, DestinationStationID: ${DestinationStationID}`); 

        let searchSql = `
            SELECT t.TrainID, t.TrainName, tf.Fare, s.AvailableSeats, tf.ClassType
            FROM Trains t
            JOIN TrainFares tf ON t.TrainID = tf.TrainID
            JOIN Seats s ON t.TrainID = s.TrainID AND tf.ClassType = s.ClassType
            WHERE tf.SourceStationID = ? 
              AND tf.DestinationStationID = ?
              AND s.AvailableSeats > 0
              AND t.TrainID = tf.TrainID
        `;

        let queryParams = [SourceStationID, DestinationStationID];

        if (ClassType) {
            searchSql += ` AND tf.ClassType = ? AND s.ClassType = ?`;
            queryParams.push(ClassType, ClassType);
        }

        db.query(searchSql, queryParams, (err, results) => {
            if (err) {
                console.error('Database error fetching trains:', err);
                return res.status(500).json({ error: 500, message: 'Database error fetching trains', details: err.message });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 404, message: 'No trains found on this route' });
            }

            console.log('Train search results:', results); 
            res.status(200).json({ success: 200, trains: results });
        });
    } catch (error) {
        console.error('Error:', error);
        if (error === 'Station not found') {
            return res.status(404).json({ error: 404, message: 'That Station is not found. Please enter a valid city name.' });
        } else {
            return res.status(500).json({ error: 500, message: 'Server error', details: error });
        }
    }
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
