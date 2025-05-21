const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const app = express();

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'));

let users = [
    {
        id: 1,
        name: "Andrew",
        favList: []
    }
]

let movies = [
    {
        Title: 'The Brutalist',
        Director: {
            Name: 'Brady Corbet',
            Bio: "Brady Corbet is an American filmmaker and actor. He made is directorial debut with the psychological drama The \"Childhood of a Leader\" (2015). He has since co-written and directed the musical drama \"Vox Lux\" (2018) and the period epic \"The Brutalist\".", 
            BirthYear: 1988
        },
        Genre: {
            Name: "Period Drama",
            Description: "Films set in a speicific historical era, focusing on the social norms, conflicts, and aesthetics of the time."
        },
    },
    {
        Title: 'Flow',
        Director: {
            Name: 'Gints Zilbalodis'
        }
    },
    {
        Title: 'Sing Sing',
        Director: {
            Name: 'Greg Kewdar'
        }
    },
    {
        Title: 'Conclave',
        Director: {
            Name: 'Edward Berger'
        }
    },
    {
        Title: 'Nickel Boys',
        Director: {
            Name: 'RaMell Ross'
        }
    },
    {
        Title: 'Nosferatu',
        Director: {
            Name: 'Robert Eggers'
        }
    },
    {
        Title: 'Anora',
        Director: {
            Name: 'Sean Baker'
        }
    },
    {
        Title: 'Dune: Part Two',
        Director: {
            Name: 'Denis Villeneuve'
        }
    },
    {
        Title: 'The Substance',
        Director: {
            Name: 'Coralie Fargeat'
        }
    },
    {
        Title: 'I\'m Still Here',
        Director: {
            Name:'Ainda Estou Aqui'
        }
    }
];

//CREATE Requests 

app.post('/users', (req, res) => {
    const newUser = req.body;

    if(!newUser.name) {
        const message = 'There is no name in the request body. Please add a name and try again';
        res.status(400).send(message);
    } else {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).send(newUser);
    }
});

app.post('/users/:id/:movieTitle', (req, res) => {
    const {id, movieTitle} = req.params; 

    let user = users.find ( user => user.id == id);

    if (user) {
        user.favList.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id}'s Favorites List.`);
    } else {
        res.status(400).send('User not found, movie could not be added to Favorites List.');
    }
});

// READ Requests
app.get('/', (req, res) => {
    res.send('Welcome to the myFlix app! Please <a href="/index.html">Click Here </a> to navigate to the home page!');
});

// app.get('/index.html', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// })
 
app.get('/movies', (req, res) =>{
    res.json(movies);
});

app.get('/movies/:title', (req, res) => {
    const {title} = req.params;
    const movie = movies.find( movie => movie.Title === title); 

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('This movie is not in the database. Please try another movie!')
    }
}); 

app.get('/movies/genre/:genreName', (req, res) => {
    const {genreName} = req.params;
    const genre = movies.find( movie => movie.Genre.Name = genreName).Genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('There is no info about this genre in the database. Sorry!');
    }
});

app.get('/movies/director/:directorName', (req, res) => {
    const {directorName} = req.params;
    const director = movies.find( movie => movie.Director.Name === directorName).Director;

    if (director) {
        res.status(200).json(director);
    } else {
        res.status(400).send('There is no information about ' + dirName.Name + ' in this database.');
    }
});

// UPDATE Requests

app.put('/users/:id', (req, res) => {
    const {id} = req.params;
    const updatedUser = req.body;

    let user = users.find(user => user.id == id); 

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send("User not found");
    }
});

// DELETE Requests

app.delete('/users/:id/:movieTitle', (req, res) => {
    const {id, movieTitle} = req.params;

    let user = users.find( user => user.id == id);

    if (user) {
        user.favList = user.favList.filter(title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from ${id}'s Favorites List.`);
    } else {
        res.status(400).send('User not found, movie could not be removed to Favorites List.');
    } // Could potentially add an else/if statement to return different error messages if the user could be found but the movie was not on their favList.
})

app.delete('/users/:id/', (req, res) => {
    const {id} = req.params; 

    let user = users.find (user => user.id == id);

    if (user) {
        users = users.filter(user => user.id != id);
        res.status(200).json(users);
    } else {
        res.status(400).send('The user you entered does not exisit.');
    }
});



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Oh no =(');
})

app.listen(8080, () =>{
    console.log('Your app is listening on port 8080.');
});