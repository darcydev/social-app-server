const firebase = require('firebase');
const { db } = require('../util/admin');

const config = require('../util/config');

firebase.initializeApp(config);

const { validateSignupData, validateLoginData } = require('../util/validators');

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

// USER LOGIN
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
// \.USER LOGIN
