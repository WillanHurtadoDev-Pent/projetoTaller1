const express = require('express');
const router = express.Router();

const passport = require('passport');
const { isLoggedIn } = require('../lib/auth');

// SIGNUP admin
router.get('/login', (req,res)=>{
  res.render('authentication/login');
});




router.post('/signup', passport.authenticate('local.signup', {
  successRedirect: '/dashboard',
  failureRedirect: '/authentication/login',
  failureFlash: true
}));






// SINGIN
router.get('/signin', (req, res) => {
  res.render('auth/signin');
});

router.post('/signin', (req, res, next) => {
  req.check('username', 'Username is Required').notEmpty();
  req.check('password', 'Password is Required').notEmpty();
  const errors = req.validationErrors();
  if (errors.length > 0) {
    req.flash('message', errors[0].msg);
    res.redirect('/signin');
  }
  passport.authenticate('local.signin', {
    successRedirect: '/dashboard',
    failureRedirect: '/authentication/login',
    failureFlash: true
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/authentication/login');
});


module.exports = router;