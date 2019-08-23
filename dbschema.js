// --------------- HEADING ---------------
/**
 * The script is a reference file
 * It is not used by our code
 */
// the layout of our data

// Firebase charges you on the amount of reads you do, so you wish to minimise the number of reads you do!
// Therefore, you include things such as commentCount, to avoid, for example, counting the number of comments on every scream
// Therefore, you keep a da indicia of the number -- which updates in the store, to avoid these 'counting' reads

const db = {
  screams: [
    {
      userHandle: 'user',
      body: 'this is the scream body',
      createdAt: '2019-08-23T01:45:20.975Z',
      likeCount: 5,
      commentCount: 2,
    },
  ],
};
