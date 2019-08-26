const firebase = require('firebase');
const { admin, db } = require('../util/admin');

const config = require('../util/.config');

firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails
} = require('../util/validators');

// User registration
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  // check the data is valid
  const { valid, errors } = validateSignupData(newUser);
  if (!valid) return res.status(400).json(errors);

  // default profile image for new Users
  const noImg = 'no-img.png';

  let token;
  let userId;
  // check user handle is unique
  // what does /users/newUser.handle mean???
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then((doc) => {
      // the user handle already existing in the db
      if (doc.exists) {
        // the react app returns Object containing erros, if the error pertains to email. The error
        // name will 'email'. Thus, in this instance, the error name pertains to 'handle'
        return res.status(400).json({ handle: 'this handle is already taken' });
      }
      return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);
    })
    // if we get here, it means that our user has been created successfully
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    // create the new User in the db
    .then((idToken) => {
      token = idToken;
      const userCreditionals = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCreditionals);
    })
    .then(() => {
      // 201 is for when something is created
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);

      if (err.code === 'auth/email-already-in-use') {
        // 400 is a client error
        return res.status(400).json({ email: 'Email is already in use' });
      }
      return res
        .status(500)
        .json({ general: 'Something went wrong, please try again' });
    });
};
// \.User registration

// User login
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const { valid, errors } = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(500)
        .json({ general: 'Wrong credentials, please try again' });
    });
};
// \.User login

// Image upload
exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy'); // parses incoming HTML form data
  const path = require('path'); // default Node package
  const os = require('os'); // default Node package
  const fs = require('fs'); // default Node package

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  // listen for event when BusBoy finds a file to stream
  // WARNING: callback function must maintain these five arguments
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    // if User has attempted to upload a non-jpeg/png file, return a 400 error
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong file type submitted' });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    // create a random number as filename, and append imageExtension to it (fe: 95196238461720360.png)
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
    // os.tmpdir() is the temp directory
    const filepath = path.join(os.tmpdir(), imageFileName);
    // update the object
    imageToBeUploaded = { filepath, mimetype };
    // pipe() is a NodeJS method
    // this will create the file
    file.pipe(fs.createWriteStream(filepath));
  });

  // when busboy is finished parsing the image, upload the image to firebase
  busboy.on('finish', () => {
    // upload the file (we just created) to firebase
    admin
      .storage()
      .bucket()
      // upload the image to a firebase 'bucket'
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        // alt=media, ensures that the image is shown on the browser (rather than downloaded to our computer)
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        // update the imageUrl field with this image for this specific User in the db
        // because we added the middleware (FBAuth) in index.js, it means that we have access to the user object,
        // thus, we can get req.user.handle
        // update() means that if it doesn't exist, it will create it
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: 'Image uploaded successfully' });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ error: err.code });
      });
  });
  // after buyboy is finished, the raw bytes of the upload will be in req.rawBody
  busboy.end(req.rawBody);
};
// \.Image upload

// Add User details
exports.addUserDetails = (req, res) => {
  // prepare the data to be uploaded to firebase
  const userDetails = reduceUserDetails(req.body);
  // get that specific User's document,
  db.doc(`/users/${req.user.handle}`)
    // and update it with the userDetails
    .update(userDetails)
    .then(() => {
      return res.json({ message: 'Details added successfully ' });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};
// \.Add User details

// get any User's details
exports.getUserDetails = (req, res) => {
  const userData = {};

  db.doc(`/users/${req.params.handle}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      userData.user = doc.data();
      return db
        .collection('screams')
        .where('userHandle', '==', req.params.handle)
        .orderBy('createdAt', 'desc')
        .get();
    })
    .then((data) => {
      userData.screams = [];
      data.forEach((doc) => {
        userData.screams.push({
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          userHandle: doc.data().userHandle,
          userImage: doc.data().userImage,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          screamId: doc.id
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
// \.get any User's details

// get own User's details
exports.getAuthenticatedUser = (req, res) => {
  const userData = {};
  db.doc(`/users/${req.user.handle}`)
    .get()
    .then((doc) => {
      // check that the User exists
      if (doc.exists) {
        // see dbschema.js for outline of db structure
        userData.credentials = doc.data();
        // return all the User's 'likes'
        return db
          .collection('likes')
          .where('userHandle', '==', req.user.handle)
          .get();
      }
    })
    .then((data) => {
      userData.likes = [];
      data.forEach((doc) => {
        userData.likes.push(doc.data());
      });
      // return 10 of the User's 'notifications'
      return db
        .collection('notifications')
        .where('recipient', '==', req.user.handle)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
    })
    .then((data) => {
      userData.notifications = [];
      data.forEach((doc) => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          screamId: doc.data().screamId,
          type: doc.data().type,
          read: doc.data().read,
          notificationId: doc.id
        });
      });
      return res.json(userData);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};
// \.get own User's details

// mark notifications read
// When the User opens a dropdown of notifications, we will an array of those
// notification ID's to this API, to mark them as read
exports.markNotificationsRead = (req, res) => {
  // batch() is for when to need to update multiple documents
  const batch = db.batch();
  req.body.forEach((notificationId) => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: 'Notifications marked read' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
// \.mark notifications read
