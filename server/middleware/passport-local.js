const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/User');
const init = require('./passport_init');

passport.use('local-login', new LocalStrategy(function(email, password, done) {
    User.findOne({email: email}, (err, user) => {
        if(err){
            return (err);
        }

        // email not found
        if(!user) {
            return done(null, false);
        }
        //Wrong password :(
        if(!user.validPassword(password)) {
            return done(null, false);
        }

        //all is well in authentication land
        return done(null, user);
    });
}));

passport.use('local-signup', new LocalStrategy(function(email, password) {
    User.findOne({email: email}, (err, user) =>{
        // user with email exists
        if(user){
            return "A user with that email already exists";
        }

        // user with email doesn exist so we make one
        let new_user = new User();
        new_user.email = email;
        new_user.password = new_user.generateHash(password);
        new_user.save((err) => {
            if(err) {
                return (err);
            }
            return done(null, new_user);
        });
    })
}));

init();
module.exports = passport;