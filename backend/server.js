const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // Database connection
const routes = require('./routes');
require('dotenv').config();
const path=require('path');
const { authenticateToken } = require('./middleware'); // Import the authentication middleware

const app = express();
const PORT = process.env.PORT || 3000;



const cors=require('cors');
const corsOptions = {
    origin: 'http://127.0.0.1:5501',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type','Authorization']
};

app.use(cors(corsOptions));














// Serve all static files from the frontend directory
app.use('/assets',express.static(path.join(__dirname, '../frontend/assets'))); 
// app.use(express.static(path.join(__dirname, '../frontend'))); 


app.get('/discovery', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/discovery.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/profile.html'));
});

// Serve index.html at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html')); // Adjust the path as necessary
});



app.use(bodyParser.json());
app.use(express.json());

app.use('/api', routes); // Use API routes
    
app.get('*', (req, res) => {
    // console.log(req);
    console.log(`Redirecting undefined route: ${req.originalUrl} to home.`); // Log for debugging
    res.redirect('/'); // Redirect to home page
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});