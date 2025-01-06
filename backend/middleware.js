const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token){  
        return res.redirect('/');
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.redirect('/');
        req.email = user.email; // Store user ID in request
        next();
    });
};

module.exports = {authenticateToken};