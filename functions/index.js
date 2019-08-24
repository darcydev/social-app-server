const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/fbAuth');

const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, login, uploadImage } = require('./handlers/users');

// --------------- SCREAM ROUTES ---------------
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postOneScream);

// --------------- USER ROUTES ---------------
app.post('/signup', signup);
app.post('/login', login);
// include Middleware FBAuth to prevent unauthorized image uploads
app.post('/user/image', FBAuth, uploadImage);

// TODO: change the region to most appropriate for Seoul
exports.api = functions.region('us-central1').https.onRequest(app);
