const express = require('express');
const path = require('path');

const app = express();

// Exportar estaticos..
app.use(express.static('public'))
app.use('/static', express.static('static'));

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', { title: 'Daidex'})
});

app.use((req, res, next) => {
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { title: 'Daidex - 404'})
    return;
  }
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));
