const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const { csrfSync } = require('csrf-sync');

const errorController = require('./controllers/error');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session); // Import MongoDB session store

const flash = require('connect-flash');
const mongoose = require('mongoose'); //can directly import mongoose 
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();



const { csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req) => {
      return req.body["CSRFToken"] || req.headers["x-csrf-token"]; // Get CSRF token from request body or headers
  } 
});




const app = express();
const MONGODB_URI =  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.kitwcix.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0`

//AI API integration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; 

if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not defined in the .env file.");
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
// Use the 'flash' model for speed
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

app.set('view engine', 'ejs');
app.set('views', 'views');

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
}); // Create a new MongoDB session store

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');


const User = require('./models/user'); // Importing the User model

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images'); // Setting the destination for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + '-' + file.originalname); // Setting the filename for uploaded files
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true); // Accept the file if it is a valid image type
  } else {
    cb(null, false); // Reject the file if it is not a valid image type
  }
};

app.use( // Using Helmet to set security-related HTTP headers, including a Content Security Policy (CSP)
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'js.stripe.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        'frame-src': ["'self'", 'js.stripe.com'],
        'font-src': ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com']
      },
    }
  })
);

app.use(compression()); // Using compression middleware to gzip responses for better performance

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); // for parsing API requests with JSON payloads
app.use(multer({storage: fileStorage , fileFilter: fileFilter }).single('image')); // Using multer to handle file uploads, single file with field name 'image'

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false , store: store}));
//the session store is used to store session data in MongoDB, allowing for persistent sessions across server restarts.
//The secret in the session middleware is a string used to sign and encrypt the session ID cookie. 
// It ensures that the session data stored in the browser cannot be tampered with by users. Always keep your secret value private and secure.


app.use(csrfSynchronisedProtection); //csrf middleware needs to be after session is created because the csrf package uses the session and before routes to protect routes. 
app.use(flash()); //adding connect-flash to the middleware for use with requests for error messages.

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
}); 
//setting local variables for use throughout the session with each request. 


app.use((req, res, next) => {
    if (!req.session.user) {
        return next(); // If no user is found in the session, proceed to the next middleware
    }

    User.findById(req.session.user._id) // we have session data here, so we can use it to find the user
    .then(user => {
        if (!user) {
            return next(); // If no user is found, proceed to the next middleware
        }
        req.user = user;
        next();
    })
    .catch(err => {
      return next(new Error(err)); // If an error occurs, pass it to the next middleware
    });
});

//chatbot endpoint
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
        const result = await model.generateContent(message);
        const response = result.response;
        const text = response.text();
        res.json({ answer: text });
    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        res.status(500).json({ error: "Sorry, I can't respond right now." });
    }
});


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500); // Error handling route for 500 errors
app.use(errorController.get404);


app.use((error, req, res, next) => {
  console.error(error); // Log the error to the console
  res.redirect('/500');
}); // Global error handling middleware to catch errors and redirect to the 500 page


mongoose.connect(MONGODB_URI)
.then((result) => {
    app.listen(process.env.PORT || 3000); // Most hosting services use port 3000 or provide their own port via environment variables.
})
.catch((err) => {
    console.log(err);
});






