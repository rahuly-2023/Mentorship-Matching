const express = require('express');
const { authenticateToken } = require('./middleware');
const router = express.Router();
const db = require('./db'); // Database connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
require('dotenv').config();


router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query('INSERT INTO users (email, password) VALUES ( ?, ?)', [email, hashedPassword]);
        res.status(201).json({ success: true, message: 'User  registered successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed: '});
    }
});







router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                const accessToken=jwt.sign({email:user.email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'15m'});
                const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
                await db.query('INSERT INTO refresh_tokens (user_email, token, expires_at) VALUES (?, ?, ?)', [user.email, refreshToken, expiresAt]);

                const [profile]=await db.query('Select * from profiles where user_email=?',[email]);
                
                if(profile.length>0){
                    const role=profile[0].role;
                    res.json({success:true, message: 'Login successful!' ,accessToken,refreshToken,profile:true, role});
                }
                else{
                    res.json({ success: true, message: 'Login successful!', accessToken, refreshToken, profile:false});
                }
                
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.status(404).json({ success: false, message: 'User not registered. Please Sign Up' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed: Email id or Password is wrong '});
    }
});



router.post('/token', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.sendStatus(403); // Forbidden

    // Check if the refresh token exists in the database
    const [rows] = await db.query('SELECT * FROM refresh_tokens WHERE token = ?', [token]);
    if (rows.length === 0) return res.sendStatus(403); // Forbidden

    const userEmail = rows[0].user_email;

    // Verify the refresh token
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err) => {
        if (err) return res.sendStatus(403); // Forbidden

        // Generate a new access token
        const accessToken = jwt.sign({ email: userEmail }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        res.json({ accessToken });
    });
});




router.get('/profile', authenticateToken, async (req, res) => {
    const email = req.email; // Get the logged-in user's Email

    try {
        const [rows] = await db.query('SELECT * FROM profiles WHERE user_email = ?', [email]);
        if (rows.length > 0) {
            res.json({ success: true, profile: rows[0] });
        } else {
            res.json({ success: false, message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve profile: '});
    }
});



router.post('/profile', authenticateToken, async (req, res) => {
    const {name, role, skills, interests, bio } = req.body;
    const email = req.email;
    
    try {
        // Check if the profile exists
        const [rows] = await db.query('SELECT * FROM profiles WHERE user_email = ?', [email]);
        
        if (rows.length > 0) {
            await db.query('UPDATE profiles SET name=?, role = ?, skills = ?, interests = ?, bio = ? WHERE user_email = ?', 
                [name, role, JSON.stringify(skills), JSON.stringify(interests), bio, email]);
            res.json({ success: true, message: 'Profile updated successfully!' });
        } else {
            await db.query('INSERT INTO profiles (user_email,name, role, skills, interests, bio) VALUES (?, ?, ?, ?, ?, ?)', 
                [email,name, role, JSON.stringify(skills), JSON.stringify(interests), bio]);
            res.json({ success: true, message: 'Profile created successfully!' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create profile: '});
    }
});



router.post('/logout', async (req, res) => {
    try{
        const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
        await db.query('DELETe FROM refresh_tokens WHERE token = ?', [token]);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to Logout '});
    }
});






router.get('/users', authenticateToken, async (req, res) => {
    const Email = req.email;
    
    try {
        const [users] = await db.query(`
            SELECT u.user_id, p.name, p.role, p.skills, p.interests, p.bio 
            FROM users u 
            LEFT JOIN profiles p ON u.email = p.user_email 
            WHERE u.email != ?`, [Email]);

        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve '});
    }
});


router.get('/requests', authenticateToken, async (req, res) => {
    const Email = req.email;
    try {
        const [sentRequests] = await db.query(`
            SELECT skills, interests, request_id, name, m.mentor_email, status, m.created_at 
            FROM mentorship_requests m join profiles p on m.mentor_email=p.user_email
            WHERE mentee_email = ?`, [Email]);

        const [receivedRequests] = await db.query(`
            SELECT skills, interests, request_id, name, m.mentee_email, status, m.created_at 
            FROM mentorship_requests m join profiles p on m.mentee_email=p.user_email 
            WHERE mentor_email = ?`, [Email]);

        res.json({ success: true, sentRequests, receivedRequests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve requests: '});
    }
});



router.patch('/requests/:id',authenticateToken, async(req, res) => {
    const requestId = parseInt(req.params.id);
    const { status } = req.body;
    
    try{
        await db.query(`Update mentorship_requests set status=? where request_id=?`,[status,requestId]);
        res.status(200).json({ message: 'Request updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to Update request '});
    }
});

router.delete('/requests/:id',authenticateToken, async(req, res) => {
    const requestId = parseInt(req.params.id);
    try{
        await db.query(`Delete from mentorship_requests where request_id=?`,[requestId]);
        res.status(200).json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to Delete request'});
    }
});







router.post('/mentorship-request', authenticateToken, async (req, res) => {
    const { mentorID } = req.body;
    const menteeEmail = req.email;

    if (!mentorID) {
        return res.status(400).json({ success: false, message: 'Mentor email is required.' });
    }

    try {
        let [email] = await db.query('select email from users where user_id=?',[mentorID]);
        email=email[0].email;
        const [existingRequest] = await db.query('SELECT * FROM mentorship_requests WHERE mentor_email = ? AND mentee_email = ?', [email, menteeEmail]);
        if (existingRequest.length > 0) {
            return res.status(400).json({ success: false, message: 'You have already sent a mentorship request to this mentor.' });
        }

        await db.query('INSERT INTO mentorship_requests (mentor_email, mentee_email, status) VALUES (?, ?, ?)', 
            [email, menteeEmail, 'pending']);

        res.json({ success: true, message: 'Mentorship request sent successfully!' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Failed to send mentorship request: ' });
    }
});














router.post('/mentorship-request/accept', authenticateToken, async (req, res) => {
    const { mentorEmail, menteeEmail } = req.body;

    try {
        await db.query('UPDATE mentorship_requests SET status = ? WHERE mentor_email = ? AND mentee_email = ?', 
            ['accepted', mentorEmail, menteeEmail]);

        res.json({ success: true, message: 'Mentorship request accepted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to accept mentorship request: ' + error.message });
    }
});


router.post('/mentorship-request/reject', authenticateToken, async (req, res) => {
    const { mentorEmail, menteeEmail } = req.body;

    try {
        await db.query('UPDATE mentorship_requests SET status = ? WHERE mentor_email = ? AND mentee_email = ?', 
            ['declined', mentorEmail, menteeEmail]);

        res.json({ success: true, message: 'Mentorship request rejected successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reject mentorship request: ' + error.message });
    }
});












router.delete('/mentorship-request', authenticateToken, async (req, res) => {
    const { mentorEmail, menteeEmail } = req.body;

    try {
        await db.query('DELETE FROM mentorship_requests WHERE mentor_email = ? AND mentee_email = ?', 
            [mentorEmail, menteeEmail]);

        res.json({ success: true, message: 'Mentorship request deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete mentorship request: ' + error.message });
    }
});






router.post('/sendChatMessage', authenticateToken, async(req,res)=>{
    const {Id, role, message} = req.body;
    const SenderEmail = req.email;

    try{
        let email;
        if(role=='mentor'){
            email=await db.query('Select mentee_email as email from mentorship_requests where request_id=?',[Id]);
        }
        else{
            email=await db.query('Select mentor_email as email from mentorship_requests where request_id=?',[Id]);
        }
        const emailId=email[0][0].email;

        const [SenderName]=await db.query('Select Name from profiles where user_email=?',[SenderEmail]);
        const [ReceiverName]=await db.query('Select Name from profiles where user_email=?',[emailId]);

        const senderName=SenderName[0].Name;
        const receiverName=ReceiverName[0].Name;

        const transporter = nodemailer.createTransport({
            service:"gmail",
            port: 465,
            secure: true, // true for port 465, false for other ports
            auth: {
                user: process.env.NodeMailer_email,
                pass: process.env.NodeMailer_pass,
            }
        });

        const mailOptions = {
            from: 'mentorshipmatching@gmail.com',
            to: emailId,
            subject: "New Message from Mentorship Platform",
            text: `Hello ${receiverName}, you have a new message from ${senderName}:\n\n ${message}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.status(500).json({ message: 'Error sending email' });
            } else {
                console.log('Email sent: ' + info.response);
                res.json({ message: 'Message sent successfully' });
            }
        });
    }
    catch(error){
        res.status(500).json({success:false,message:error.message})
    }
})




module.exports=router;