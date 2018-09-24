const fetch = require('./fetch');

module.exports.checkAuth = async (ctx, next) => {
  try {
    let token = sessionStorage.getItem('token');
    if (!token) {
      window.location.replace("/signin");
    }
    fetch.getData('/profile/', token)
      .then(data => {
        ctx.user = data;
        ctx.token = token;
        sessionStorage.setItem('user', JSON.stringify(data));
        next();
      })
      .catch(error => console.error(error))
  } catch (err) {
    console.log(err);
  }
}

module.exports.validateToken = async (ctx, next) => {
  let user_id = ctx.params.id;
  let token = ctx.params.token;

  fetch.getData(`/set-password/${user_id}/${token}/`)
  .then(data => {
    data.success == true ? ctx.validToken = true : ctx.validToken = false;
    next();
  })
  .catch(error => console.error(error))
}
