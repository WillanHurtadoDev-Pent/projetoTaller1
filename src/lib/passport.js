const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');


/*INICIO---DE---SESION-------------------------------------------------------------------*/
passport.use('local.signin', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password, done) => {
  const rows = await pool.query('SELECT * FROM usuario WHERE username = ?', [username]);
  if (rows.length > 0) {
    const usuario = rows[0];
    const validPassword = await helpers.matchPassword(password, usuario.password)
    if (validPassword) {
      req.session.usuario = usuario.idUsuario;      
      req.session.priv = usuario.idPrivilegio;
  
      done(null, usuario, req.flash('success', 'bienvenido a  ' + usuario.username));
      
    } else {
      done(null, false, req.flash('message', 'contraseña incorrecta'));
    }
  } else {
    return done(null, false, req.flash('message', 'el usuario ingresado no es valido'));
  }
}));

passport.serializeUser((usuario, done) => {
    done(null, usuario.idUsuario);
});


passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM usuario WHERE idUsuario= ?', [id]);
  done(null, rows[0]);
});

/*REGISTRO---DE---NUEVO---USUARIO-------------------------------------------------------------*/

passport.use('local.signup', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, username, password,  done) => {
  const {telefono,email,idPrivilegio} = req.body;
  let newUser = {
    username,
    password,
    telefono,
    idPrivilegio,
    email
  
  };
  newUser.password = await helpers.encryptPassword(password);
  // Saving in the Database
  const result = await pool.query('INSERT INTO usuario SET ? ', newUser);
  newUser.idUsuario = result.insertId;
  const admin = { idUsuario:6};
  return done(null, admin);
}));
