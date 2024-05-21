import express from 'express';
import db from './utils/db.js';
import userRouter from './routes/user.route.js';
import trainRouter from './routes/train-routes.js';
import bookingRouter from './routes/booking.routes.js';
import passengerRoute from './routes/passenger.route.js';
import paymentRoute from './routes/payment.route.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});


app.get('/', (req, res) => {
    res.send('Welcome to ticket reservation system');
});


app.use('/users',userRouter);
app.use('/train',trainRouter);
app.use('/booking',bookingRouter);
app.use('/passenger', passengerRoute );
app.use('/payment',paymentRoute);
app.listen(3001, () => {
    console.log('Server started on port 3001');
});