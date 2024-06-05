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
  const result = changes.reduce((acc, change) => {
    const codeReviews = change.labels['Code-Review']?.all;
    if (!codeReviews) {
      return acc;
    }

    const reviewer = codeReviews.find(item => item._account_id == reviewerId);
    if (reviewer) {
      if(reviewer.value){
        const date = new Date(reviewer.date);
        const day = date.getDay();
        if (acc.reviewsByday[day]) {
          acc.reviewsByday[day]++;
        } else {
          acc.reviewsByday[day] = 1;
        }
      }
      switch (reviewer.value) {
        case 1:
          acc.counts.plusOnes++;
          break;
        case -1:
          acc.counts.minusOnes++;
          break;
        case 2:
          acc.counts.plusTwos++;
          break;
        case -2:
          acc.counts.minusTwos++;
          break;
      }
    }
    return acc;
  }, {
    counts :{ plusOnes: 0, minusOnes: 0, plusTwos: 0, minusTwos: 0 },
    reviewsByday: {}
  });

  return result;
}

const getComments = async (change) => {
  const url = baseURL + `/a/changes/${change.id}/comments`;
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
  return {change, comments: parsedData};
}

const totalCommentsRecieved = async (changes) => {
  let maxComments = 0;
  let maxCommentsUrl = '';
  let maxCommentsId = '';

  const allComments = await Promise.all(changes.map(change => getComments(change)));

  const counts = allComments.reduce((total, {change, comments}) => {
    const commentCount = Object.values(comments).flat().length;

    if (commentCount > maxComments) {
      maxComments = commentCount;
      maxCommentsUrl = baseURL + `/c/${change.project}/+/${change._number}`;
      maxCommentsId = change.change_id;
    }

    return total + commentCount;
  }, 0);

  return { total: counts, maxComment: { id:maxCommentsId, count: maxComments, url: maxCommentsUrl }};
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

const getOpenChanges = async (owner) => {

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

  const totalComments = comments.total;
  const maxComments = comments.maxComment;

  const commentsPerChange = totalComments / (ownChangesCount ? ownChangesCount : 1);

  const result = {
    userId,
    ownChangesCount,
    addedAsReviewer,
    reviews,
    comments: totalComments,
    maxComments,
    reviewedChanges,
    oldestOpenChanges,
    commentsPerChange
  }

  return result;
}

module.exports = { getChanges, getReviews, getUserData }
