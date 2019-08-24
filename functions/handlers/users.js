const firebase = require('firebase');
const { admin, db } = require('../util/admin');

const config = require('../util/config');

firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails
} = require('../util/validators');

// USER REGISTRATION
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
      return res.status(500).json({ error: err.code });
    });
};
// \.USER REGISTRATION

// --------------- USER LOGIN ---------------
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
      if (err.code === 'auth/wrong-password') {
        return res
          .status(403)
          .json({ general: 'Wrong credentials, please try again' });
      }
      return res.status(500).json({ error: err.code });
    });
};
// --------------- \.USER LOGIN ---------------

// --------------- IMAGE UPLOAD ---------------
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
// --------------- \.IMAGE UPLOAD ---------------

// --------------- ADD USER DETAILS ---------------
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
// --------------- \.ADD USER DETAILS ---------------

// --------------- GET OWN USER DETAILS ---------------
exports.getAuthenticatedUser = (req, res) => {
  const userData = {};
  db.doc(`/users/${req.user.handle}`)
    // retrieve the contents of a document
    .get()
    .then((doc) => {
      // check that the User exists
      if (doc.exists) {
        // see dbschema.js for outline of db structure
        userData.credentials = doc.data();
        // return all the 'likes' associated with this User
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
      return res.json(userData);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};
// --------------- \.GET OWN USER DETAILS ---------------
