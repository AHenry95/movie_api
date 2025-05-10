const express = require('express'), 
    morgan = require('morgan');

const app = express();

let topMovies = [
    {
        title: 'The Brutalist',
        director: 'Brady Corbert'
    },
    {
        title: 'Flow',
        director: 'Gints Zilbalodis'
    },
    {
        title: 'Sing Sing',
        director: 'Greg Kwedar'
    },
    {
        title: 'Conclave',
        director: 'Edward Berger'
    },
    {
        title: 'Nickel Boys',
        director: 'RaMell Ross'
    },
    {
        title: 'Nosferatu',
        director: 'Robert Eggers'
    },
    {
        title: 'Anora',
        director: 'Sean Baker'
    },
    {
        title: 'Dune: Part Two',
        director: 'Denis Villeneuve'
    },
    {
        title: 'The Substance',
        director: 'Coralie Fargeat'
    },
    {
        title: 'I\'m Still Here',
        director: 'Ainda Estou Aqui'
    }
];

app.use(morgan('common'));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Welcome to the myFlix app!');
});

app.get('/movies', (req, res) =>{
    res.json(topMovies);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Oh no =(');
})

app.listen(8080, () =>{
    console.log('Your app is listening on port 8080.');
});