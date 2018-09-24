const yo = require('yo-yo');

module.exports = function layout(ctx, content) {
  let user = JSON.parse(sessionStorage.getItem('user'));
  let hello = user.first_name ? `${user.first_name} ${user.last_name}` : user.email

  return yo`<div class="container">
    <header>
      <img src="/img/logo-white.png" alt="logo" class="logo" width="150" />
      <menu class="navmenu">
        <ul class="items">
          <li class="item"><a href="/dashboard">Dashboard</a></li>
          <li class="item"><a href="#">Tradding</a></li>
          <li class="item"><a href="/profile" class="blue">${hello}</a></li>
          <li class="item"><a href="#" onclick=${logout}>Cerrar Sesion</a></li>
        </ul>
      </menu>
    </header>
    <section>
      <h1 id="title" class="title2">${ctx.title}</h1>
      ${content}
    </section>
  </div>`;

  function logout (ev) {
    ev.preventDefault();
    console.log('se ejecuta');
    sessionStorage.clear();
    window.location.replace("/signin");
  }
}
