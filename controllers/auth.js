const User = require('../models/user'); // Importing the User model
const bcrypt = require('bcryptjs'); // Importing bcrypt for password hashing
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Importing crypto for generating random tokens
const path = require('path');
const { validationResult } = require('express-validator');

// Create a transporter object
const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 587,
    secure: false, // use SSL
    auth: {
        user: '8eca2d4db374c1',
        pass: '36ad1b2b2051af',
    }
});

exports.getLogin = (req, res, next) => {
    console.log(req.session.isLoggedIn); // Log the session status
    let message = req.flash('error');
    //to fix the error panel display issue 
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message, //displaying error message using the key
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        }
        , validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req); // Validate the request using express-validator
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: ''
            },
            validationErrors: errors.array()
        });
    }

    //moving user creation from middleware to here 
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                // req.flash('error', 'Invalid email or password'); //adding a key-value to the request for display later 
                // return res.redirect('/login');
                //instead of redirecting, we render the login page with an error message
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationErrors: [],
                });
            }
            bcrypt
                .compare(password, user.password)
                .then((doMatch) => {
                    if (doMatch) {
                        req.session.isLoggedIn = true; // Set the session as logged in
                        req.session.user = user; // Store the user in the session
                        return req.session.save(err => { // Save the session before redirecting 
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Invalid email or password.',
                        oldInput: {
                            email: email,
                            password: password,
                        },
                        validationErrors: [],
                    });
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect('/login');
                });
        })
        .catch((err) => console.log(err));
};


exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    //to fix the error panel display issue 
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
};


exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req); // Validate the request using express-validator

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg, // Get the first error message
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validationErrors: errors.array()
        });
    }

    bcrypt.hash(password, 12) // Hash the password with a salt round of 12
        .then((hashedPassword) => {
            const user = new User({
                email: email,
                password: hashedPassword, // Store the hashed password
                cart: { items: [] } // Initialize an empty cart
            });
            return user.save(); // Save the new user to the database
        })
        .then((result) => {
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'test@test.com',
                subject: 'Signup succeeded!',
                html: '<h1>You sucessfully signed up!</h1>'
            });
        })
        .catch((err) => {
            console.log(err);
        });
}; 


exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/'); // Redirect to the home page after logout
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message,
    });
};

//below method will be triggered when user clicks reset password and we use crypto to generate a 32 byte random token and 
// store it with an expiration time of 1 hour in the user document. 
//only if user clicks link in the email we will allow password reset. 
//we use the ' in html while sending mail so that we can insert multiple lines in the html email body and we dynamically insert token in the link
exports.postReset = (req, res, next) => {
    const email = req.body.email;
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex'); // Generate a random token
        User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token; // Store the token in the user document
                user.resetTokenExpiration = Date.now() + 3600000; // Token valid for 1 hour
                return user.save();
            })
            .then(result => {
                if (result) {
                    res.redirect('/'); // Redirect to home page after saving the token
                    transporter.sendMail({
                        to: email,
                        from: 'test@test.com',
                        subject: 'Password Reset',
                        html: `
                        <p>You requested a password reset</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                    `
                    });
                }
            })
            .catch(err => {
                console.log(err);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } }) // Find user with valid token
        .then(user => {
            if (!user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/reset');
            }
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token, // Pass the token to the view
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    User.findOne({
        _id: userId,
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() } // Check if the token is valid
    })
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid token or user not found.');
                return res.redirect('/reset');
            }
            resetUser = user; // Store the user to update later
            return bcrypt.hash(newPassword, 12); // Hash the new password
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword; // Update the user's password
            resetUser.resetToken = null; // Clear the reset token
            resetUser.resetTokenExpiration = null;
            return resetUser.save(); // Save the updated user document
        })
        .then(result => {
            res.redirect('/login'); // Redirect to login after password reset
        })
        .catch(err => {
            console.log(err);
        });
};