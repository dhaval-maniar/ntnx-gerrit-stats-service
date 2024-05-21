const axios = require('axios');
const https = require('https');
require('dotenv/config');

const baseURL = "https://gerrit.eng.nutanix.com";
const username = process.env.GERRIT_USERNAME;
const password = process.env.GERRIT_PASSWORD;

const agent = new https.Agent({  
  rejectUnauthorized: false
});

const oldestChanges = async (changes) => {
  let oldest = changes.map((item) => {
    return {
      id: item.change_id,
      project: item.project,
      created: item.created,
      uniqueId: item._number
    }
  })
  oldest.sort((a,b) => new Date(a.created) - new Date(b.created));

  oldest = oldest.map((item) => {
    return {
      id: item.id,
      url: baseURL + `/c/${item.project}/+/${item.uniqueId}`,
      created: item.created 
    }
  })

  return oldest;
}

const codeReviews = (changes) => {
  let counts = changes.reduce((acc, change) => {
    let codeReviews = change.labels['Code-Review'].all;
    return codeReviews.reduce((acc, item) => {
      if (item.value === 1) acc.plusOnes++;
      else if (item.value === -1) acc.minusOnes++;
      else if (item.value === 2) acc.plusTwos++;
      else if (item.value === -2) acc.minusTwos++;
      return acc;
    }, acc);
  }, { plusOnes: 0, minusOnes: 0, plusTwos: 0, minusTwos: 0 });

  return counts;
}

const getChanges = async (owner) => {
  try {
    const response = await axios.get(baseURL + `/changes/?q=owner:${owner}&o=DETAILED_LABELS`, {
      httpsAgent: agent,
      auth: {
        username: username,
        password: password
      },
      transformResponse: [(data) => {
        return data.substring(data.indexOf('\n') + 1);
      }]
    })
    const parsedData = JSON.parse(response.data);
    const oldest = await oldestChanges(parsedData);
    const reviews = await codeReviews(parsedData);
    console.log(reviews);
    return parsedData;
  } catch (error) {
    console.log(error);
    return null;
  }
}

module.exports = { getChanges }
