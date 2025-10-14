/** 
 * @fileoverview Authentication module for handling JWT token generation and login route
 * @description Manages user authentication and JWT token creation for the myFlix API
 * @requires jsonwebtoken
 * @requires passport
*/

const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken'),
    passport = require('passport');

require('./passport');

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username,
        expiresIn: '7d',
        algorithm: 'HS256'
    });
}

/**
 * @name POST /login
 * @description Authenticates an exsiting user and returns a JWT token
 * @param {string} Username - the user's username
 * @param {string} Password - The user's password
 * @returns {Object} 200 - User object and JWT Token 
 * @returns {Object} 400 - Authentication failed 
 * @example
 * // Request Body 
 *  * {
    "Username": "JohnnyD1",
    "Password": "Password123",
}
 * // Response Body 
 *  {
        {
            "_id": "123456789asdfghjkl",
            "Name": "John Doe",
            "Username": "JohnnyD1",
            "Birthdate": "01-01-1990",
            "Email": "jdoe@example.com",
            "Favorites": []
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }      
 */
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false}, (error, user, info) => {
            if (error || !user ) {
                return res.status(400).json({
                    message: 'Something is not right',
                    user: user
                });
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });
        })(req, res);
    });
}