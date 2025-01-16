const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db'); // Database connection
const routes = require('./routes');
require('dotenv').config();
const path=require('path');

const app = express();
const PORT = process.env.PORT || 3000;


// Serve all static files from the frontend directory
app.use('/assets',express.static(path.join(__dirname, '../frontend/assets')));


app.get('/discovery', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/discovery.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/profile.html'));
});

// Serve index.html at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});



app.use(bodyParser.json());
app.use(express.json());

app.use('/api', routes);
    
app.get('*', (req, res) => {
    res.redirect('/');
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});