const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // console.log("Authenticating")
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    // console.log("Tok ",token);

    if (!token){  
        // console.log("NOt success")
        return res.redirect('/'); // Redirect to login page if no token
    }
    // console.log("Success")
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // console.log(err);
        if (err) return res.redirect('/'); // Redirect to login page if no token
        req.email = user.email; // Store user ID in request
        next();
    });
};

module.exports = {authenticateToken};