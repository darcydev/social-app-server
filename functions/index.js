const functions = require('firebase-functions');

const app = require('express')();

// MIDDLEWARE to prevent unauthorized access
const FBAuth = require('./util/fbAuth');

const {
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream,
  deleteComment
} = require('./handlers/screams');

const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require('./handlers/users');

// --------------- SCREAM ROUTES ---------------
// GET
app.get('/screams', getAllScreams); // intentionally not middleware protected, so anyone can view screams
app.get('/scream/:screamId', getScream); // intentionally not middleware protected, so anyone can view screams
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.get('/scream/:commentId/uncomment', FBAuth, deleteComment);
// POST
app.post('/scream', FBAuth, postOneScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
// DELETE
app.delete('/scream/:screamId', FBAuth, deleteScream);

// --------------- USER ROUTES ---------------
// GET
app.get('/user', FBAuth, getAuthenticatedUser);
// POST
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);

// TODO: change to most appropriate image
exports.api = functions.region('us-central1').https.onRequest(app);
