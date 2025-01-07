# Mentorship Matching Platform
A web-based platform that facilitates mentorship connections between individuals.

## Overview
This project aims to design and develop a user-friendly web-based platform that facilitates mentorship connections between individuals. Users can create profiles, specify their skills and interests, and find matches for mentorship opportunities.

## System Requirements
- **Node.js**
- **MySQL**
- **Front-end**: HTML, CSS, JavaScript
- **Back-end**: Express.js, MySQL2

## Running the Platform
### Prerequisites
- **Node.js**: Version 14 or higher
- **MySQL**: Version 8 or higher

### Running the Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## API Endpoints
### Authentication:
- `POST /api/register`: Register a new user
- `POST /api/login`: Login an existing user
- `POST /api/token`: Refresh access token
- `POST /api/logout`: Logout a user

### Profiles:
- `GET /api/profile`: Get a user's profile information
- `POST /api/profile`: Create or update a user's profile information

### Mentorship Requests:
- `GET /api/requests`: Get a user's mentorship requests
- `POST /api/mentorship-request`: Send a mentorship request
- `PATCH /api/requests/:id`: Update a mentorship request status
- `DELETE /api/requests/:id`: Delete a mentorship request

### Users:
- `GET /api/users`: Get the list of all users to search

### Email Chat Functionality:
- `POST /api/sendChatMessage`: Send a chat message through email to a mentor or mentee after accepting a request

## Database Schema
### Create Database
```sql
CREATE DATABASE mentorship_platform;
USE mentorship_platform;
```

### Create Tables

#### Users Table
```sql
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL
);
```

#### Profiles Table
```sql
CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(100),
    skills TEXT,
    interests TEXT,
    bio TEXT,
    FOREIGN KEY (user_email) REFERENCES users(email)
);
```

#### Mentorship Requests Table
```sql
CREATE TABLE mentorship_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_email VARCHAR(255) NOT NULL,
    mentee_email VARCHAR(255) NOT NULL,
    status ENUM('pending', 'accepted', 'declined') NOT NULL,
    FOREIGN KEY (mentor_email) REFERENCES users(email),
    FOREIGN KEY (mentee_email) REFERENCES users(email)
);
```

#### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    token TEXT NOT NULL,
    FOREIGN KEY (user_email) REFERENCES users(email)
);
```

## Features
### User Features
- **User Profiles**: Create and manage user profiles
- **Mentorship Requests**: Send and manage mentorship requests
- **Email Chat**: Communicate with mentors or mentees via email after accepting a request
- **Discovery**: Search for users by role, skills, and interests

### Security Features
- **Authentication**: Secure authentication using JSON Web Tokens (JWT)
- **Authorization**: Middleware to check authentication and authorization
- **Password Hashing**: Secure password hashing using bcrypt

