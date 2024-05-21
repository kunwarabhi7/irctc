import { Router } from "express";
import db from "../utils/db.js";

const paymentRoute = Router();

paymentRoute.get("/",(req,res)=>{
db.query("SELECT * FROM Payments",(err,data)=>{
    if(err) throw err;
    res.json({status:200, data})
});
})

paymentRoute.post('/', (req, res) => {
    const { BookingID, PaymentAmount, PaymentMethod } = req.body;

    if (!BookingID || !PaymentAmount || !PaymentMethod) {
        return res.status(400).json({ error: 400, message: 'All required fields must be filled' });
    }

    const paymentQuery = `
        INSERT INTO Payments (BookingID, PaymentDate, PaymentAmount, PaymentMethod, PaymentStatus)
        VALUES (?, NOW(), ?, ?, 'Completed')
    `;

    db.query(paymentQuery, [BookingID, PaymentAmount, PaymentMethod], (err, paymentResult) => {
        if (err) {
            return res.status(500).json({ error: 500, message: 'Database error invalid booking ID' });
        }

        const updateBookingQuery = `
            UPDATE Bookings SET Status = 'Paid'
            WHERE BookingID = ?
        `;
        console.log(BookingID)

        db.query(updateBookingQuery, [BookingID], (err) => {
            if (err) {
                const deletePaymentQuery = `DELETE FROM Payments WHERE PaymentID = ?`;
                db.query(deletePaymentQuery, [paymentResult.insertId], (deleteErr) => {
                    if (deleteErr) {
                        return res.status(500).json({ error: 500, message: 'error: Failed to update booking status and rollback payment' });
                    }
                    return res.status(500).json({ error: 500, message: 'Database error updating booking status. Payment rolled back' });
                });
            } else {
                res.status(200).json({ success: 200, message: 'Payment completed successfully', PaymentID: paymentResult.insertId });
            }
        });
    });
});




export default paymentRoute;