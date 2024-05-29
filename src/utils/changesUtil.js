const axios = require('axios');
const https = require('https');
const moment = require('moment');
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
  const counts = changes.reduce((acc, change) => {
    const codeReviews = change.labels['Code-Review']?.all;
    if (!codeReviews) {
      return acc;
    }

    return codeReviews.reduce((acc, item) => {
      switch (item.value) {
        case 1:
          acc.plusOnes++;
          break;
        case -1:
          acc.minusOnes++;
          break;
        case 2:
          acc.plusTwos++;
          break;
        case -2:
          acc.minusTwos++;
          break;
      }
      return acc;
    }, acc);
  }, { plusOnes: 0, minusOnes: 0, plusTwos: 0, minusTwos: 0 });

  return counts;
}

const codeReviewed = async (changes, reviewerId) => {
  const counts = changes.reduce((acc, change) => {
    const codeReviews = change.labels['Code-Review']?.all;
    if (!codeReviews) {
      return acc;
    }

    const reviewer = codeReviews.find(item => item._account_id == reviewerId);
    if (reviewer) {
      switch (reviewer.value) {
        case 1:
          acc.plusOnes++;
          break;
        case -1:
          acc.minusOnes++;
          break;
        case 2:
          acc.plusTwos++;
          break;
        case -2:
          acc.minusTwos++;
          break;
      }
    }

    return acc;
  }, { plusOnes: 0, minusOnes: 0, plusTwos: 0, minusTwos: 0 });

  return counts;
}

const getComments = async (changeId) => {
  const url = baseURL + `/a/changes/${changeId}/comments`;
  const response = await axios.get(url, {
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
  return parsedData;
}

const totalCommentsRecieved = async (changes) => {
  const allComments = await Promise.all(changes.map(change => getComments(change.id)));

  const counts = allComments.reduce((total, comments) => {
    const commentCount = Object.values(comments).flat().length;
    return total + commentCount;
  }, 0);

  return counts;
}

const getChanges = async (owner, startDate, endDate) => {

  let oneWeekAgo = moment().subtract(1, 'weeks').format('YYYY-MM-DD');
  startDate = startDate ? startDate : oneWeekAgo;
  let today = moment().startOf('day').format('YYYY-MM-DD');
  endDate = endDate ? endDate : today;

  let query = `owner:${owner}+after:${startDate}+before:${endDate}`

  try {
    const response = await axios.get(baseURL + `/a/changes/?q=${query}&o=DETAILED_LABELS`, {
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
    return parsedData;
  } catch (error) {
    console.log(error);
    return null;
  }
}

const getReviews = async (reviewer, startDate, endDate) => {
  
  let oneWeekAgo = moment().subtract(1, 'weeks').format('YYYY-MM-DD');
  startDate = startDate ? startDate: oneWeekAgo;
  let today = moment().startOf('day').format('YYYY-MM-DD');
  endDate = endDate ? endDate : today;

  let query = `reviewer:${reviewer}+after:${startDate}+before:${endDate}`

  try {
    const response = await axios.get(baseURL + `/a/changes/?q=${query}&o=DETAILED_LABELS`, {
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
    return parsedData;
  } catch (error) {
    console.log(error);
    return null;
  }
}

const getOpenChanges = async (owner, startDate, endDate) => {

  let query = `owner:${owner}+status:open`

  try {
    const response = await axios.get(baseURL + `/a/changes/?q=${query}&o=DETAILED_LABELS`, {
      httpsAgent: agent,
      auth: {
        username: username,
        password: password
      },
      transformResponse: [(data) => {
        return data.substring(data.indexOf('\n') + 1);
      }]
    });
    const parsedData = JSON.parse(response.data);
    return parsedData;
  } catch (error) {
    console.log(error);
    return null;
  }
}

const getUserData = async (id, startDate, endDate) => {
  const userId = id;

  const [ownChanges, reviewChanges, openChanges] = await Promise.all(
    [
      getChanges(userId,startDate,endDate), 
      getReviews(userId,startDate,endDate), 
      getOpenChanges(userId,startDate,endDate)
    ]
  );

  const ownChangesCount = ownChanges.length;
  const addedAsReviewer = reviewChanges.length;

  const [reviews, comments, reviewedChanges, oldestOpenChanges] = await Promise.all([
    codeReviews(ownChanges),
    totalCommentsRecieved(ownChanges),
    codeReviewed(reviewChanges, userId),
    oldestChanges(openChanges)
  ]);

  const result = {
    userId,
    ownChangesCount,
    addedAsReviewer,
    reviews,
    comments,
    reviewedChanges,
    oldestOpenChanges,
  }

  return result;
}

module.exports = { getChanges, getReviews, getUserData }
