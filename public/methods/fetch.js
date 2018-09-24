require('es6-promise').polyfill();
require('isomorphic-fetch');

const BASE_API = 'http://localhost:8000';
const BASE_URL = `${BASE_API}/api/v1`;

// POST method
module.exports.postData = (url=``, data={}, token=null) => {
  // Default options are marked with *
  let headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json"
  }
  if (token) headers.Authorization = `Token ${token}`;

  return fetch(BASE_URL + url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .catch(error => console.error(`Fetch Error =\n`, error));
};

// PUT method
module.exports.putData = (url=``, data={}, token=null) => {

  // Default options are marked with *
  let headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json"
  }
  if (token) headers.Authorization = `Token ${token}`;

  return fetch(BASE_URL + url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
  })
  .then(response => response.json())
  .catch(error => console.error(`Fetch Error =\n`, error));
};

// GET method
module.exports.getData = (url=``, token=null) => {
  // Default options are marked with *
  let headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json"
  }
  if (token) headers.Authorization = `Token ${token}`;

  return fetch(BASE_URL + url, {
      method: "GET",
      headers
  })
  .then(response => response.json())
  .catch(error => console.error(`Fetch Error =\n`, error));
};
