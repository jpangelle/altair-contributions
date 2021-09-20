require('dotenv').config({ path: '.env' });
const axios = require('axios');
const { MongoClient } = require('mongodb');

const { MONGO_DB_URI } = process.env;

const mongoDBClient = new MongoClient(MONGO_DB_URI);

const makeQuery = after => `
  query {
    contributions (after: ${
      after ? `"${after}"` : null
    }, first: 100, filter: {  fundId: { equalTo: "2088-EmKDCmxqHbmY4fsNSvM1fWX1z3jSGYKEekxtBqFsxzHW96E-0" }}) {
        nodes {
            account
            amount
        },
        pageInfo {
            hasNextPage
            endCursor
        }
    }
  }`;

const getContributionsFromSubquery = async after => {
  const query = makeQuery(after);

  try {
    const { data } = await axios(
      'https://api.subquery.network/sq/subvis-io/kusama-auction',
      {
        method: 'POST',
        data: JSON.stringify({ query }),
        headers: { 'content-type': 'application/json' },
      },
    );

    return data.data.contributions;
  } catch (error) {
    console.log('error:', error.message);
  }
};

const loop = async (endCursor, page = 1, contributions = []) => {
  const current = await getContributionsFromSubquery(endCursor);

  const { nodes, pageInfo } = current;

  const { hasNextPage } = pageInfo;

  contributions.push(nodes);

  if (hasNextPage) {
    return loop(pageInfo.endCursor, page + 1, contributions);
  } else {
    console.log('done!');
    return contributions;
  }
};

// runs every 5 minutes
setInterval(async () => {
  await mongoDBClient.connect();
  const database = mongoDBClient.db('altair-contributions');

  const contributionCollection = database.collection('contributions');

  const timestampCollection = database.collection('timestamp');

  console.log('running');
  const timestamp = new Date();
  const contributions = await loop();

  console.log('deleting contributions');
  await contributionCollection.deleteMany({});

  console.log('writing contributions to db');
  await contributionCollection.insertMany(contributions.flat());

  console.log('deleting timestamp');
  await timestampCollection.deleteMany({});

  console.log('writing timestamp to db');
  await timestampCollection.insertMany([{ timestamp }]);
}, 1000 * 60 * 5);
