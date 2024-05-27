import { Router } from "express";
import db from "../utils/db.js";
import nodemailer from 'nodemailer'
import crypto from 'crypto'

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


  
  
// forgot password
userRouter.post('/forgotpassword', (req, res) => {
    const { email } = req.body;
console.log(email);
    // Check if email is provided
    if (!email) {
        return res.status(400).json({ error: 'Please enter an email' });
    }


    db.query('SELECT * FROM Users WHERE Email = ?', [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }

        // If no user with the provided email is found
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];

        // Generate a secure token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Calculate token expiration time (1 hour from now)
        const resetTokenExpires = new Date();
        resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

        // Update the database with the reset token and its expiration time
        db.query('UPDATE Users SET ResetToken = ?, ResetTokenExpires = ? WHERE UserID = ?', 
            [resetToken, resetTokenExpires, user.UserID], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error', details: err.message });
                }

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'abhishek@credenc.com',
            pass: 'password'
                    }
                });

                const mailOptions = {
                    from: 'abhishek@gmail.com',
                    to: user.Email,
                    subject: 'Password Reset',
                    text: `You have requested a password reset. Please click on the following link to reset your password: http://localhost:3001/users/resetpassword?token=${resetToken}`,
                    };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                        return res.status(500).json({ error: 'Failed to send email', details: error.message });
                    }
                    console.log('Email sent:', info.response);
                    res.status(200).json({ message: 'Password reset email sent successfully' });
                });
            });
    });
});

// Reset Password 
userRouter.post('/resetpassword', (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and newPassword are required' });
    }

    db.query('SELECT * FROM Users WHERE ResetToken = ? AND ResetTokenExpires > NOW()', [token], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const user = results[0];

        db.query('UPDATE Users SET Password = ?, ResetToken = NULL, ResetTokenExpires = NULL WHERE UserID = ?', 
            [newPassword, user.UserID], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error', details: err.message });
                }

                res.status(200).json({ message: 'Password reset successfully' });
            });
    });
});


userRouter.post('/send-email', (req, res) => {
    const { to, subject, text, html } = req.body;

    // Validate email fields
    if (!to || !subject || (!text && !html)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create transporter object
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'abhishek@credenc.com',
            pass: 'password'
        }
    });

    // Construct email options
    const mailOptions = {
        from: 'abhishek@credenc.com',
        to: to,
        subject: subject,
        text: text,
        html: html
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ error: 'Failed to send email', details: error.message });
        } else {
            console.log('Email sent:', info.response);
            res.status(200).json({ message: 'Email sent successfully' });
        }
    });
});




export default userRouter
