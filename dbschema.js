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
  users: [
    {
      userId: 'dh23gh34938dfdfe3kfex',
      email: 'user@email.com',
      handle: 'user',
      createdAt: '2019-08-21T01:35:10.975Z',
      imageUrl: 'image/dsddfdgfgr3/dksjkjfvf',
      bio: 'Hello, my name is User. Welcome to my profile.',
      website: 'https://user.com',
      location: 'London, UK'
    }
  ],
  screams: [
    {
      userHandle: 'user',
      body: 'this is the scream body',
      createdAt: '2019-08-23T01:45:20.975Z',
      likeCount: 5,
      commentCount: 2
    }
  ],
  comments: [
    {
      userHandle: 'user',
      screamId: 'kdjsfgdksuufhgkdsufky',
      body: 'nice one mate!',
      createdAt: '2019-03-15T10:59:52.798Z'
    }
  ]
};

const userDetails = {
  // Redux data
  credentials: {
    userId: 'N43KJ5H43KJHREW4J5H3JWMERHB',
    email: 'user@email.com',
    handle: 'user',
    createdAt: '2019-03-15T10:59:52.798Z',
    imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
    bio: 'Hello, my name is user, nice to meet you',
    website: 'https://user.com',
    location: 'Lonodn, UK'
  },
  likes: [
    {
      userHandle: 'user',
      screamId: 'hh7O5oWfWucVzGbHH2pa'
    },
    {
      userHandle: 'user',
      screamId: '3IOnFoQexRcofs5OhBXO'
    }
  ]
};
