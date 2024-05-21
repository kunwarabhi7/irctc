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