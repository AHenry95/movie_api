const mongoose = require('mongoose')
    bcrypt = require('bcrypt');

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
    Actors: [{type: mongoose.Schema.Types.ObjectId, ref: 'Actor'}],
});

let userSchema = mongoose.Schema({
    Name: {type: String, required: true},
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Birthdate: String,
    Email: {type: String, required: true},
    Favorites: [{type: mongoose.Schema.Types.ObjectId, ref:'Movie'}]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function(password){
    return bcrypt.compareSync(password, this.password);
};

let actorsSchema = mongoose.Schema({ 
    Name: {type: String, required: true},
    Birthyear: String,
    Movies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);
let Actor = mongoose.model('Actor', actorsSchema);

module.exports.Movie = Movie;
module.exports.User = User;
module.exports.Actor = Actor;