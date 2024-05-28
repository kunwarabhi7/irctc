import jwt from 'jsonwebtoken';

const secret = "mysecretkey";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    

    if (!authHeader) {
        return res.status(401).json({ error: 'Authentication failed! No token provided.' });
    }

    const bearer = authHeader.split(' ');
    if (bearer.length !== 2 || bearer[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Authentication failed! Invalid token format.' });
    }

    const token = bearer[1];
    console.log(token);

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token is not valid' });
        }
        req.user = user;
        next();
    });
};
