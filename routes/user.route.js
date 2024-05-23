import { Router } from "express";
import db from "../utils/db.js";

const userRouter = Router();


userRouter.get('/', (req, res) => {
    db.query('SELECT * FROM Users', (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

// User Registration
userRouter.post('/', (req, res) => {
    console.log(req.body);
    const { UserName, Password, Email, PhoneNumber, DateOfBirth, Gender, Address,fullName } = req.body;
    //  input validation
    const errors = [];
    if (!UserName || UserName.length < 3) {
        errors.push('UserName must be at least 3 characters long');
    }
    if (!Password || Password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!Email || !emailRegex.test(Email)) {
        errors.push('Email must be valid');
    }
    if(!fullName) errors.push('Full Name is required');
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!PhoneNumber || !phoneRegex.test(PhoneNumber)) {
        errors.push('PhoneNumber must be valid');
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!DateOfBirth || !dateRegex.test(DateOfBirth)) {
        errors.push('DateOfBirth must be a valid date in YYYY-MM-DD format');
    }
    if (!['M', 'F'].includes(Gender)) {
        errors.push('Gender must be M or Female');
    }
    if (!Address || Address.trim() === '') {
        errors.push('Address must not be empty');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const sql = 'INSERT INTO Users (UserName, Password, Email, PhoneNumber, DateOfBirth, Gender, Address ,fullName) VALUES (?, ?, ?, ?, ?, ?, ?,?)';
    const values = [UserName, Password, Email, PhoneNumber, DateOfBirth, Gender, Address , fullName];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'User already Exists' });
        }

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    });
});

// User Login

userRouter.post('/login', (req, res) => {
    console.log('Request Body:', req.body);

    const { UserName, Password } = req.body;
//check for username or password
    if (!UserName || !Password) {
        return res.status(400).json({ error: 'Email and Password are required. Please fill' });
    }


    const sql = 'SELECT * FROM Users WHERE UserName = ? AND Password = ?';
    
    db.query(sql, [UserName, Password], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }


        if (result.length > 0) {
            return res.status(200).json({UserID:result[0].UserID, message: 'Login successful' });
        } else {
            return res.status(401).json({ error: 'Username or password is incorrect' });
        }
    });
});




export default userRouter
