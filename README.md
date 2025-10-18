# myFlix Movie API

A RESTful API built with Node.js and Express that provides movie information, user authentication, and user profile management.
This backend service powers movie applications by serving data about films, directors, genres, and actors while managing user accounts and personalized favorite lists.

## Features
- **User Authentication**: Secure JWT-based authentcation with password hashing
- **Movie Database**: Access to database with comprehensive information on includes movies, including titles, decriptions, directors, genres, and cast
- **User Profiles**: Account creation, updates, and management
- **Favorites**: Users can add and remove movies from a list of favorites associated with their profile
- **Data Validation**: Express Validator is used to validate any user form input
- **RESTful Design**: API endpoints are clean, predictable, and follow REST principles

## Tech Stack
- Node.js
- Express.js
- MongoDB with Mongoose
- Passport.js
- JWT
- bcrypt
- Express Validator
- CORS
- Morgan
