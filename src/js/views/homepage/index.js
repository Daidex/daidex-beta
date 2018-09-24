const page = require('page');
const empty = require('empty-element');
const title = require('title');
const template = require('./template');

page('/', (ctx, next) => {
  title('Daidex');
  const main = document.getElementById('root');

  empty(main).appendChild(template());
})
