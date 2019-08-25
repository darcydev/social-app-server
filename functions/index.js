const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth'); // MIDDLEWARE to prevent unauthorized access
const { db } = require('./util/admin');

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
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead
} = require('./handlers/users');

// Scream Routes
app.get('/screams', getAllScreams); // intentionally not middleware protected, so anyone can view screams
app.get('/scream/:screamId', getScream); // intentionally not middleware protected, so anyone can view screams
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
app.get('/scream/:commentId/uncomment', FBAuth, deleteComment);
app.post('/scream', FBAuth, postOneScream);
app.post('/scream/:screamId/comment', FBAuth, commentOnScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);

// User Routes
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);

// Notification Routes
app.post('/notifications', FBAuth, markNotificationsRead);

// TODO: change to most appropriate image
exports.api = functions.region('us-central1').https.onRequest(app);

// --------------- NOTIFICATIONS --------------- //
// CREATE NOTIFICATIONS
exports.createNotificationOnLike = functions
  .region('us-central1')
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          // create a notification with the snapshot.id (which is the likeDoc id)
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'like',
            read: false,
            screamId: doc.id
          });
        }
      })
      // the reason we don't need to send back any response is because this is a database trigger, and not an API endpoint
      .then(() => {})
      .catch((err) => {
        console.error(err);
      });
  });

exports.createNotificationOnComment = functions
  .region('us-central1')
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    db.doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          // create a notification with the snapshot.id (which is the commentDoc id)
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: 'comment',
            read: false,
            screamId: doc.id
          });
        }
      })
      .then(() => {})
      .catch((err) => {
        console.error(err);
      });
  });

// DELETE NOTIFICATIONS
// TODO: consider merging these into a single function (that takes a param of likes/comments)
exports.deleteNotificationOnUnLike = functions
  .region('us-central1')
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {})
      .catch((err) => {
        console.error(err);
      });
  });

exports.deleteNotificationOnUnLike = functions
  .region('us-central1')
  .firestore.document('comments/{id}')
  .onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {})
      .catch((err) => {
        console.error(err);
      });
  });
