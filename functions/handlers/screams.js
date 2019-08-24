const { db } = require('../util/admin');

// --------------- FUNCTIONS ---------------

// GET ALL SCREAMS
exports.getAllScreams = (req, res) => {
  db.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      const screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount
        });
      });
      return res.json(screams);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// POST A SCREAM
exports.postOneScream = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ body: 'Body must not be empty' });
  }

  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
    userImage: req.user.imageUrl, // from fbAuth.js
    likeCount: 0,
    commentCount: 0
  };

  db.collection('screams')
    .add(newScream)
    .then((doc) => {
      /* res.json({ message: `document ${doc.id} created successfully` }); */
      const resScream = newScream; // ???
      resScream.screamId = doc.id;
      res.json(resScream);
    })
    .catch((err) => {
      res.status(500).json({ error: 'something went wrong' });
      console.error(err);
    });
};
// \.POST A SCREAM

// GET ONE SCREAM
exports.getScream = (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Scream not found' });
      }
      // get the data assocated with this scream
      screamData = doc.data();
      screamData.screamId = doc.id;
      // return all the comments associated with this scream
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc') // TODO: arrange by ascending order
        .where('screamId', '==', req.params.screamId)
        .get();
    })
    .then((data) => {
      screamData.comments = [];
      // iterate over each of the comments
      data.forEach((doc) => {
        screamData.comments.push(doc.data());
      });
      return res.json(screamData); // curly braces not needed, as it is already JSON object
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ err: err.code });
    });
};
// \.GET ONE SCREAM

// COMMENT ON A SCREAM
exports.commentOnScream = (req, res) => {
  // if the User sent an empty comment
  if (req.body.body.trim() === '') {
    return res.status(400).json({ error: 'Must not be empty' });
  }

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle, // comes from fbAuth.js
    userImage: req.user.imageUrl // comes from fbAuth.js
  };
  console.log(newComment);

  // add the newComment to the associated scream
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Scream not found' });
      }
      // update the commentCount on the associated scream
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    // add the newComment to the associated scream
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      // return newComment back to the User (to display on User interface) as JSON object
      res.json(newComment);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    });
};
// \.COMMENT ON A SCREAM

// LIKE A SCREAM
exports.likeScream = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userHandle', '==', req.user.handle) // ??? why is this necessary
    .where('screamId', '==', req.params.screamId)
    .limit(1);
};
// \.LIKE A SCREAM

// UNLIKE A SCREAM

// \.UNLIKE A SCREAM

// DELETE A SCREAM

// \.DELETE A SCREAM
