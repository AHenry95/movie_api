/**
 * @file Main Express application for movie API
 * @description RESTful API for for movie applications, including movie database, user authentication, and user profile management
 * @requires express
 * @requires morgan
 * @requires body-parser
 * @requires mongoose
 * @requires passport
 * @requires cors
 * @requires express-validator 
 */

const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  Models = require('./models.js'),
  passport = require('passport');
  cors = require('cors')
;

const { check, validationResult } = require('express-validator');

require('./passport');

const Movies = Models.Movie;
const Users = Models.User;
const Actors = Models.Actor;

const app = express();

// Middleware setup
app.use(cors()); 
app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'));

let auth = require('./auth')(app);

// Connects with local MongoDB database
// mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true});

// Connects with Atlas databse
mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});

// ================== CREATE Requests ==================

/**
 * @name POST /users
 * @description Create a new user
 * @param {string} Name - User's full name (required)
 * @param {string} Username - User's username, alphanmeric only, min. 5 characters (required) 
 * @param {string} Password - Users password, min 8 characters (required) 
 * @param {string} Email - User's valid email address (required)
 * @param {string} Birthdate - User's birthdate (optional)
 * @returns {Object} 201 - Successfully created user object
 * @returns {Object} 409 - Username already exists
 * @returns {Object} 422 - Validation error
 * @returns {Object} 500 - Server error
 * @example
 * // Request Body
 * {
 *     "Name": "John Doe",
 *     "Username": "JohnnyD1",
 *     "Password": "password",
 *     "Email": "jdoe@example.com",
 *     "Birthdate": "01-01-1990"
 * }
 * 
 * // Response Body
 *  {
 *     "_id": "123456789asdfghjkl",
 *     "Name": "John Doe",
 *     "Username": "JohnnyD1",
 *     "Email": "jdoe@example.com",
 *     "Birthdate": "01-01-1990",
 *     "Favorites": []
 * }  
 */

app.post('/users', 
    [
        check('Name', 'Name is required').not().isEmpty(),
        check('Username', 'Username is required').not().isEmpty(),
        check('Username', 'Username must be at least 5 characters').isLength({ min: 5 }),
        check('Username', 'Username contains non-alphanumeric characters - not allowed').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Password', 'Password must be at least 8 characters').isLength({ min: 8}),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], async (req, res) => {
    
    let errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(422).json({ errors: errors.array() });
    }
    try {
        const exisitingUser = await Users.findOne({ Username: req.body.Username });
        
        if (exisitingUser) {
            return res.status(409).send(req.body.Username + ' already exisits');
        }
       
        let hashedPassword = Users.hashPassword(req.body.Password);

        const newUser = await Users.create({
            Name: req.body.Name,
            Email: req.body.Email,
            Username: req.body.Username,
            Birthdate: req.body.Birthdate
        });

        return res.status(201).json(newUser);
    } 
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

/**
 * @name POST /users/:userID/movies/:movieID 
 * @description Add a movie to a user's favorites list. Requires JWT bearer token authentication
 * @param {string} userID - The user's ObjectId in the database
 * @param {string} movieID - The movie's ObjectId in the database
 * @returns {Object} 200 - Updated user object with new favorite movie added
 * @returns {Object} 404 - The requested movie could not be found in the database
 * @returns {Object} 500 - Server error
 * @example
 * // Demo Request URL: /users/123456789asdfghjkl/movies/6840cde5b1602cc150368065
 * // Response Body 
 * {
    "_id": "123456789asdfghjkl",
    "Name": "John Doe",
    "Username": "JohnnyD1",
    "Birthdate": "01-01-1990",
    "Email": "jdoe@example.com",
    "Favorites": [
        "6840cde5b1602cc150368065"
    ]
}
 */

app.post('/users/:userID/movies/:movieID', passport.authenticate('jwt', {session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({ _id: req.params.movieID});
        const userToUpdate = await Users.findOne({ _id: req.params.userID });

        if(!movie) {
            return res.status(404).send('Movie Not Found');
        }

        if(!userToUpdate) {
            return res.status(404).send('No such User');
        }

        const updatedUser = await Users.findOneAndUpdate(
            { _id: req.params.userID },
            { $addToSet: {Favorites: movie._id} },
            { new: true } 
        );

        res.json(updatedUser); 
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// ================== READ Requests ==================

/**
 * GET / - Returns welcome message
 * @returns {string} 200 - Welcome message
 */
app.get('/', (req, res) => {
    res.send('Welcome to the movie api! Please <a href="/index.html">Click Here </a> to navigate to the home page!');
});

/**
 * @name GET /users
 * @description Gets information for all users. Requires JWT bearer token authentication
 * @returns {Array<Object>} 200 - Array of user objects
 * @returns {Object} 500 - Server Error  
 * @example
 *  // Response Body
 * [
        {
            "_id": "123456789asdfghjkl",
            "Name": "John Doe",
            "Username": "JohnnyD1",
            "Birthdate": "01-01-1990",
            "Email": "jdoe@example.com",
            "Favorites": [
                "6840cde5b1602cc150368065"
            ]
        },
        // the rest of the user objects in the database here
    ]
 */
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try{
        const allUsers = await Users.find();

        res.status(200).json(allUsers);
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

/**
 * @name GET /users/:userID
 * @description Gets information for a single user. Requires JWT bearer token authentication
 * @param {string} userID - The user's ObjectId in the database
 * @returns {Object} 200 - User object containing the user's Name, Username, Email, Birthdate, and Favorites list
 * @returns {Object} 404 - User not found in database
 * @return {Object} 500 - Server Error
 * @example
 * // Demo Request URL: /users/123456789asdfghjkl
 * // Response Body
 * * [
        {
            "_id": "123456789asdfghjkl",
            "Name": "John Doe",
            "Username": "JohnnyD1",
            "Birthdate": "01-01-1990",
            "Email": "jdoe@example.com",
            "Favorites": [
                "6840cde5b1602cc150368065"
            ]
        },
        // the rest of the user objects in the database here
    ]
 */
app.get('/users/:userID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try{
        const user = await Users.findOne({ _id: req.params.userID });

        if(!user) {
            return res.status(404).send('User not found');
        }

        res.status(200).json({
            _id: user._id,
            Name: user.Name,
            Username: user.Username,
            Email: user.Email,
            Birthdate: user.Birthdate,
            Favorites: user.Favorites
        });
    }
    catch(err){
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

/**
 * @name GET /users/:userID/favs
 * @description Gets a single user's favorites list. Requires JWT bearer token authentication
 * @param {string} userID - The user's ObjectId in the database
 * @returns {Array<string>} 200 - Array of movie titles
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Server error
 * @example
 * // Demo Request URL:  /users/123456789asdfghjkl/favs
 * // Response Body
 *  [
        "The Brutalist"
    ]
 */
app.get('/users/:userID/favs', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try{
        const user = await Users.findOne({ _id: req.params.userID }).populate('Favorites', 'Title');

        if(!user) {
            return res.status(404).send('User not found');
        }

        const movieTitles = user.Favorites.map(movie => movie.Title); 

        res.status(200).json(movieTitles);
    }
    catch(err){
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

/**
 * @name GET /movies
 * @description Gets all movies in the database. Requires JWT bearer token authentication
 * @returns {Array<Object>} 200 - Array of all movie objects with actors populated
 * @returns {Object} 500 - Server error 
 * @example
 * // Response body  
 * [
        {
            "Director": {
                "Name": "Brady Corbet",
                "Bio": "Brady Corbet is an American filmmaker and actor. He made his directorial debut with the psychological drama The \"Childhood of a Leader\" (2015). He has since co-written and directed the musical drama \"Vox Lux\" (2018) and the period epic \"The Brutalist\".",
                "BirthYear": "1988"
            },
            "Genre": {
                "Name": "Period Drama",
                "Description": "Films set in a specific historical era, focusing on the social norms, conflicts, and aesthetics of the time."
            },
            "_id": "6840cde5b1602cc150368065",
            "Title": "The Brutalist",
            "Description": "The Brutalist is the story of fictional Hungarian-Jewish holocaust survivor and renowned architect László Tóth's immigration to the United States, and the personal and professional success and strife he finds there.",
            "Actors": [
                {
                    "_id": "684339c287dc272b16890b78",
                    "name": "Adrien Brody",
                    "birthYear": "1973",
                    "movies": [
                        {
                            "_id": "6840cde5b1602cc150368065",
                            "Title": "The Brutalist"
                        }
                    ]
                },
                {
                    "_id": "684339c287dc272b16890b79",
                    "name": "Felicty Jones",
                    "birthYear": "1983",
                    "movies": [
                        {
                            "_id": "6840cde5b1602cc150368065",
                            "Title": "The Brutalist"
                        }
                    ]
                },
                {
                    "_id": "684339c287dc272b16890b7a",
                    "name": "Guy Pearce",
                    "birthYear": "1967",
                    "movies": [
                        {
                            "_id": "6840cde5b1602cc150368065",
                            "Title": "The Brutalist"
                        }
                    ]
                },
                {
                    "_id": "684339c287dc272b16890b7b",
                    "name": "Joe Alwyn",
                    "birthYear": "1991",
                    "movies": [
                        {
                            "_id": "6840cde5b1602cc150368065",
                            "Title": "The Brutalist"
                        }
                    ]
                },
                {
                    "_id": "684339c287dc272b16890b7c",
                    "name": "Raffey Cassidy",
                    "birthYear": "2001",
                    "movies": [
                        {
                            "_id": "6840cde5b1602cc150368065",
                            "Title": "The Brutalist"
                        }
                    ]
                },
                {
                    "_id": "684339c287dc272b16890b7d",
                    "name": "Stacy Martin",
                    "birthYear": "1990",
                    "movies": [
                        {
                            "_id": "6840cde5b1602cc150368065",
                            "Title": "The Brutalist"
                        }
                    ]
                }
            ],
            "ReleaseYear": "2024"
        },
        // The rest of the movie objects here
    ]
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const allMovies = await Movies.find().populate({
            path: 'Actors',
            populate: {
                path: 'movies',
                select: 'Title'
            }
        });
        
        res.status(200).json(allMovies);
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

/**
 * @name GET /movies/:movieID
 * @description Gets a single movies in the database. Requires JWT bearer token authentication
 * @param {String} movieID - The movie's ObjectId in the database
 * @returns {Object} 200 - Movie object with populated actors  
 * @returns {Object} 404 - Movie not found
 * @returns {Object} 500 - Server error 
 * @example
 * // Demo Request URL: /movies/6840cde5b1602cc150368065
 * // Response body  
 * {
        "Director": {
            "Name": "Brady Corbet",
            "Bio": "Brady Corbet is an American filmmaker and actor. He made his directorial debut with the psychological drama The \"Childhood of a Leader\" (2015). He has since co-written and directed the musical drama \"Vox Lux\" (2018) and the period epic \"The Brutalist\".",
            "BirthYear": "1988"
        },
        "Genre": {
            "Name": "Period Drama",
            "Description": "Films set in a specific historical era, focusing on the social norms, conflicts, and aesthetics of the time."
        },
        "_id": "6840cde5b1602cc150368065",
        "Title": "The Brutalist",
        "Description": "The Brutalist is the story of fictional Hungarian-Jewish holocaust survivor and renowned architect László Tóth's immigration to the United States, and the personal and professional success and strife he finds there.",
        "Actors": [
            {
                "_id": "684339c287dc272b16890b78",
                "name": "Adrien Brody",
                "birthYear": "1973",
                "movies": [
                    {
                        "_id": "6840cde5b1602cc150368065",
                        "Title": "The Brutalist"
                    }
                ]
            },
            {
                "_id": "684339c287dc272b16890b79",
                "name": "Felicty Jones",
                "birthYear": "1983",
                "movies": [
                    {
                        "_id": "6840cde5b1602cc150368065",
                        "Title": "The Brutalist"
                    }
                ]
            },
            {
                "_id": "684339c287dc272b16890b7a",
                "name": "Guy Pearce",
                "birthYear": "1967",
                "movies": [
                    {
                        "_id": "6840cde5b1602cc150368065",
                        "Title": "The Brutalist"
                    }
                ]
            },
            {
                "_id": "684339c287dc272b16890b7b",
                "name": "Joe Alwyn",
                "birthYear": "1991",
                "movies": [
                    {
                        "_id": "6840cde5b1602cc150368065",
                        "Title": "The Brutalist"
                    }
                ]
            },
            {
                "_id": "684339c287dc272b16890b7c",
                "name": "Raffey Cassidy",
                "birthYear": "2001",
                "movies": [
                    {
                        "_id": "6840cde5b1602cc150368065",
                        "Title": "The Brutalist"
                    }
                ]
            },
            {
                "_id": "684339c287dc272b16890b7d",
                "name": "Stacy Martin",
                "birthYear": "1990",
                "movies": [
                    {
                        "_id": "6840cde5b1602cc150368065",
                        "Title": "The Brutalist"
                    }
                ]
            }
        ],
        "ReleaseYear": "2024"
    }
 */
app.get('/movies/:movieID', passport.authenticate('jwt', { session: false}), async (req, res) => {
    try {
        const movie = await Movies.findOne({ _id: req.params.movieID }).populate({
            path: 'Actors',
            populate: {
                path: 'movies',
                select: 'Title'
            }
        });

        if (movie) {
            res.status(200).json(movie);
        } else {
            res.status(404).send('This movie is not in the database. Please try another movie!')
        }
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
}); 

/**
 * @name GET /movies/genre/:genreName
 * @description Gets information about a single genre by name. Requires JWT bearer token authentication
 * @returns {Object} 200 - Genre object with genre name and description
 * @returns {Object} 400 - Genre not found within database
 * @returns {Object} 500 - Server error
 * @example
 * // Demo request URL: /movies/genre/Period%20Drama
 * // Response Body
 * {
        "Name": "Period Drama",
        "Description": "Films set in a specific historical era, focusing on the social norms, conflicts, and aesthetics of the time."
    }
 */
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false}), async (req, res) => {
    try {
        const movie = await Movies.findOne({ "Genre.Name": req.params.genreName });
        const genre = movie.Genre;

        if (genre) {
            res.status(200).json(genre);
        } else {
            res.status(400).send('There is no info about this genre in the database. Sorry!');
        }
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: '+ err);
    }
});

/**
 * @name GET /movies/director/:directorName
 * @description Gets information about a single director by name. Requires JWT bearer token authentication
 * @param {string} directorName - The name of the director
 * @returns {Object} 200 - Director object with Director Name, Bio, and BirthYear
 * @returns {Object} 400 - Director not found within database
 * @returns {Object} 500 - Server error
 * @example
 * // Demo Request URL: /movies/director/Brady%20Corbet
 * // Response Body
 * {
        "Name": "Brady Corbet",
        "Bio": "Brady Corbet is an American filmmaker and actor. He made his directorial debut with the psychological drama The \"Childhood of a Leader\" (2015). He has since co-written and directed the musical drama \"Vox Lux\" (2018) and the period epic \"The Brutalist\".",
        "BirthYear": "1988"
    }
 */
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false}), async (req, res) => {
    try {    
        const movie = await Movies.findOne({ "Director.Name": req.params.directorName });
        const director = movie.Director;

        if (director) {
            res.status(200).json(director);
        } else {
            res.status(400).send('There is no information about ' + req.params.directorName + ' in this database.');
        }
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// ================== UPDATE Requests ==================

/**
 * @name PUT /users/:userID
 * @description Updates a user's profile information. Requires JWT bearer token authentication
 * @param {string} userID - The user's ObjectId in the database
 * @param {string} Name - User's full name (optional)
 * @param {string} Username - User's username, alphanmeric only, min. 5 characters (optional) 
 * @param {string} Password - Users password, min 8 characters (optional) 
 * @param {string} Email - User's valid email address (optional)
 * @param {string} Birthdate - User's birthdate (optional)
 * @returns {Object} 200 - Updated user object (password not included in response)
 * @returns {Object} 403 - Permission denied (user can only update their own profile)
 * @returns {Object} 404 - User not found
 * @returns {Object} 422 - Valdiation error (body contains content that violates validation)
 * @returns {Object} 500 - Server error
 * @example
 * // Demo Request URL: /users/123456789asdfghjkl
 * // Request Body
 *  {
        "Name": JohnDoe1
    }
 *
 * // Response Body
 *  {
        "_id": "123456789asdfghjkl",
        "Name": "John Doe",
        "Username": "JohnDoe1",
        "Birthdate": "01-01-1990",
        "Email": "jdoe@example.com",
        "Favorites": [
            "6840cde5b1602cc150368065"
        ]
    }
 */
app.put('/users/:userID', 
    [
        check('Username', 'Username must be at least 5 characters').optional().isLength({ min: 5 }),
        check('Username', 'Username contains non-alphanumeric characters - not allowed').optional().isAlphanumeric(),
        check('Password', 'Password must be at least 8 characters').optional().isLength({ min: 8}),
        check('Email', 'Email does not appear to be valid').optional().isEmail()
    ],
    passport.authenticate('jwt', { session: false}), async (req, res) => {
        let errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(422).json({ errors: errors.array() });
        }; 

        try { 
            if(req.user._id.toString() !== req.params.userID){
                return res.status(403).send('Permission denied');    
            }

            let update = {};

            if(req.body.Name){
                update['Name'] = req.body.Name;
            }

            if(req.body.Email){
                update['Email'] = req.body.Email;
            }

            if(req.body.Username){
                update['Username'] = req.body.Username;
            }

            if(req.body.Password){
                update['Password'] = Users.hashPassword(req.body.Password);
            }

        if(req.body.Birthdate){
                update['Birthdate'] = req.body.Birthdate;
        }

            const user = await Users.findOneAndUpdate(
                { _id: req.params.userID},
                { $set: update },
                { new: true }
            );

            if (!user) {
                return res.status(404).send('The requested user could not be found.');
            }

            return res.status(200).json(
                {
                    Name: user.Name,
                    Email: user.Email,
                    Username: user.Username,
                    Birthdate: user.Birthdate
                }
            );
        }
        catch(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        }
});

// ================== DELETE Requests ==================

/**
 * @name DELETE /users/:userID/movies/:movieID
 * @description Removes a movie from a user's favorites list.
 * @param {string} userID - The user's ObjectId in the database
 * @param {string} movieID - The movie's ObjectId in the database
 * @returns {Object} 200 - Updated user object with selected movie removed from user favorites
 * @returns {Object} 404 - Either movie or user not found
 * @returns {Object} 500 - Server error 
 * @example 
 * // Demo Request URL: /users/123456789asdfghjkl/movies/6840cde5b1602cc150368065
 * // Response Body  
 *  * {
    "_id": "123456789asdfghjkl",
    "Name": "John Doe",
    "Username": "JohnDoe1",
    "Birthdate": "01-01-1990",
    "Email": "jdoe@example.com",
    "Favorites": []
}
 */
app.delete('/users/:userID/movies/:movieID', passport.authenticate('jwt', { session: false}), async (req, res) => {
    try {
        const movie = await Movies.findOne({ _id: req.params.movieID });
        const user = await Users.findOne({ _id: req.params.userID });

        if(!movie) {
            return res.status(404).send('Movie not found');
        }

        if(!user) {
            return res.status(404).send('User not found');
        }
        
        const updatedUser = await Users.findOneAndUpdate(
                { _id: req.params.userID },
                { $pull: { Favorites: movie._id }},
                { new: true }
        );

        res.status(200).json(updatedUser);
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

/**
 * @name DELETE /users/:userID/
 * @description Removes a selected user account. Requires JWT bearer token authentication
 * @returns {string} 200 - Message indicating the account has been deleted
 * @returns {Object} 400 - User not found
 * @returns {Object} 500 - Server error
 * @example
 * // Demo Request URL: /users/123456789asdfghjkl
 * // Response message: "JohnDoe1 was deleted from myFlix."
 */
app.delete('/users/:userID/', passport.authenticate('jwt', {session: false }), async (req, res) => {
    try {
        const user = await Users.findOneAndDelete({ _id: req.params.userID });
        
        if (!user) {
            return res.status(400).send('There is no user with that username.');   
        } else {
            res.status(200).send(user.Username + ' was deleted from myFlix.');
        }
    }   
    catch(err){
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Oh no =(');
})

// Listener used to start express server
const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});
