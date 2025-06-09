const mongoose = require('mongoose');

let movieSchema = mongoose.Schema({ 
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Director: {
        Name: String,
        Bio: String,
        BirthYear: String
    },
    Genre: {
        Name: String,
        Description: String
    },
    Actors: [String],
});

let userSchema = mongoose.Schema({
    Name: {type: String, required: true},
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Birthdate: String,
    Favorites: [String]
});

let actorsSchema = mongoose.Schema({ 
    Name: {type: String, required: true},
    Birthyear: String,
    Movies: [String]
});

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);
let Actor = mongoose.model('Actor', actorsSchema);

module.exports.Movie = Movie;
module.exports.User = User;
module.exports.Actor = Actor;