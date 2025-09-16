const express = require('express');

const authController = require('../controllers/auth');
const { check , body } = require('express-validator')


const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    [check('email').trim().isEmail().withMessage('Please enter a valid email'),
     body('password', 'Password must be at least 5 characters long').isLength({ min: 5 }).isAlphanumeric()
    ], 
    authController.postLogin);

router.post('/signup',
    [check('email').trim().isEmail().withMessage('Please enter a valid email')
     .custom((value, { req }) => { 
         return User.findOne({ email: value }).then(user => {
             if (user) {
                 return Promise.reject('Email already in use');
             }
         });
     }),
     body('password', 'Password must be at least 5 characters long').trim().isLength({ min: 5 }).isAlphanumeric(),
     body('confirmPassword').trim().custom((value, { req }) => {
         if (value !== req.body.password) {
             throw new Error('Passwords do not match');
         }
         return true;
     })
    ],authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword); //:token is a route parameter that we are extracting later in the controller.

router.post('/new-password', authController.postNewPassword); //post request to update the password

module.exports = router;

