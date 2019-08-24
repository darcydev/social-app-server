const functions = require('firebase-functions');

const app = require('express')();

// MIDDLEWARE to prevent unauthorized access
const FBAuth = require('./util/fbAuth');

const { getAllScreams, postOneScream } = require('./handlers/screams');
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require('./handlers/users');

// --------------- SCREAM ROUTES ---------------
// GET
app.get('/screams', getAllScreams);
app.get('/user', FBAuth, getAuthenticatedUser);
// POST
app.post('/scream', FBAuth, postOneScream);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);

// --------------- USER ROUTES ---------------
// POST
app.post('/signup', signup);
app.post('/login', login);

// TODO: change to most appropriate image
exports.api = functions.region('us-central1').https.onRequest(app);
