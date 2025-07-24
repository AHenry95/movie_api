const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
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

app.use(cors()); 
app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'));

let auth = require('./auth')(app);

// Connects with local MongoDB database
// mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true});

// Connects with Atlas databse
mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});

//CREATE Requests 

// Adds New User 
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
            Password: hashedPassword,
            Birthdate: req.body.Birthdate
        });

        return res.status(201).json(newUser);
    } 
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

//Adds Movie to User's FavList
app.post('/users/:Username/movies/:movieID', passport.authenticate('jwt', {session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({ _id: req.params.movieID});
        const userToUpdate = await Users.findOne({ Username: req.params.Username });

        if(!movie) {
            return res.status(404).send('Movie Not Found');
        }

        if(!userToUpdate) {
            return res.status(404).send('No such User');
        }

        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $push: {Favorites: movie._id} },
            { new: true } 
        );

        res.json(updatedUser); 
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

// READ Requests
app.get('/', (req, res) => {
    res.send('Welcome to the myFlix app! Please <a href="/index.html">Click Here </a> to navigate to the home page!');
});


// Get a list of all users
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

// Get a list of all movies in the database
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

// Get info about a movie by title

app.get('/movies/:title', passport.authenticate('jwt', { session: false}), async (req, res) => {
    try {
        const movie = await Movies.findOne({ Title: req.params.title }).populate({
            path: 'Actors',
            populate: {
                path: 'movies',
                select: 'Title'
            }
        });

        if (movie) {
            res.status(200).json(movie);
        } else {
            res.status(400).send('This movie is not in the database. Please try another movie!')
        }
    }
    catch(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
}); 

// Get info about genre by genre name 
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

// Get details about director by name
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

// UPDATE Requests

//Change user password, via their username 
app.put('/users/:Username', 
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
            if(req.user.Username !== req.params.Username){
                return res.status(400).send('Parmission denied');    
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
                { Username: req.params.Username},
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

// DELETE Requests

//Removes selected movie from user's favorite list, user is selected via their email address
app.delete('/users/:Username/movies/:movieID', passport.authenticate('jwt', { session: false}), async (req, res) => {
    try {
        const movie = await Movies.findOne({ _id: req.params.movieID });
        const user = await Users.findOne({ Username: req.params.Username });

        if(!movie) {
            return res.status(404).send('Movie not found');
        }

        if(!user) {
            return res.status(404).send('User not found');
        }
        
        const updatedUser = await Users.findOneAndUpdate(
                { Username: req.params.Username },
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

// Removes User identifed via their username
app.delete('/users/:username/', passport.authenticate('jwt', {session: false }), async (req, res) => {
    try {
        const user = await Users.findOneAndDelete({ Username: req.params.username });
        
        if (!user) {
            res.status(400).send('There is no user with that username.');   
        } else {
            res.status(200).send(user.Username + ' was deleted from myFlix.');
        }
    }   
    catch(err){
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Oh no =(');
})

const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});