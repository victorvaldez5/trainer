const express = require('express');
const router = express.Router();
const passport = require('passport');
const passportLocal = require('../middleware/passport-local');

// SIGNUP USER
router.post(
  '/signup',
  passportLocal.authenticate('local-signup', {
    successRedirect: '/',
    failureMessage: "Didn't work bro",
  })
);

router.post(
  '/login',
  passport.authenticate('local-login', {
    successRedirect: '/',
    failureMessage: "Didn't work bro",
  })
);

router.get('/current_user', (req, res, next) => {
  if (!req.user) {
    res.status(401).send({});
  }
  res.status(200).json({ email: req.user.email });
});

router.get('/logout', (req, res, next) => {
  req.logout();
  res.status(200).send({ message: 'Logout successful' });
});

module.exports = router;
