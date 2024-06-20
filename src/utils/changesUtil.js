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

const oldestChanges = (changes) => {
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
          acc.plusOnes.push({
            id: change.change_id,
            url: baseURL + `/c/${change.project}/+/${change._number}`,
          });
          break;
        case -1:
          acc.minusOnes.push({
            id: change.change_id,
            url: baseURL + `/c/${change.project}/+/${change._number}`,
          });
          break;
        case 2:
          acc.plusTwos.push({
            id: change.change_id,
            url: baseURL + `/c/${change.project}/+/${change._number}`,
          });
          break;
        case -2:
          acc.minusTwos.push({
            id: change.change_id,
            url: baseURL + `/c/${change.project}/+/${change._number}`,
          });
          break;
      }
      return acc;
    }, acc);
  }, { plusOnes: [], minusOnes: [], plusTwos: [], minusTwos: [] });

  return counts;
}

const codeReviewed = (changes, reviewerId) => {
  const result = changes.reduce((acc, change) => {
    const codeReviews = change.labels['Code-Review']?.all;
    if (!codeReviews) {
      return acc;
    }

    const reviewer = codeReviews.find(item => item._account_id == reviewerId);
    if (reviewer) {
      switch (reviewer.value) {
        case 1:
          acc.plusOnes.push({
            id: change.change_id,
            url: baseURL + `/c/${change.project}/+/${change._number}`,
          });
          break;
        case -1:
          acc.minusOnes.push({
            id: change.change_id,
            url: baseURL + `/c/${change.project}/+/${change._number}`,
          });
          break;
        case 2:
          acc.plusTwos.push({
            id: change.change_id,
            url: baseURL + `/c/${change.project}/+/${change._number}`,
          });
          break;
        case -2:
          acc.minusTwos.push({
            id: change.change_id,
            url: baseURL + `/c/${change.project}/+/${change._number}`,
          });
          break;
      }
    }
    return acc;
  }, {
    plusOnes: [],
    plusTwos: [],
    minusOnes: [],
    minusTwos: []
  });

  return result;
}

const reviewsByFilter = async (changes, reviewerId, type = "DAY") => {
  const result = changes.reduce((acc, change) => {
    const codeReviews = change.labels['Code-Review']?.all;
    if (!codeReviews) {
      return acc;
    }

    const reviewer = codeReviews.find(item => item._account_id == reviewerId);
    if (reviewer) {
      if(reviewer.value){
        if(type === "DAY"){
          const date = new Date(reviewer.date);
          const day = date.getDay();
          if (acc.reviewsByday[day]) {
            acc.reviewsByday[day]++;
          } else {
            acc.reviewsByday[day] = 1;
          }
        }
      }
    }
    return acc;
  }, {
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

  const allComments = await Promise.all(changes.map(change => getComments(change)));

  const counts = allComments.reduce((acc, {change, comments}) => {
    let commentCount = 0;
    const key = "in_reply_to"

    for (const [_, commentArray] of Object.entries(comments)) {
      if (Array.isArray(commentArray)) {
        commentCount += commentArray.filter(comment => !comment.hasOwnProperty(key)).length;
      }
    }

    if(Object.keys(comments).length > 0){
      acc.changes.push({
        id: change.change_id,
        url: baseURL + `/c/${change.project}/+/${change._number}`,
        comments: commentCount
      });
    }

    acc.comments += commentCount;
    return acc;
  }, {
    changes: [],
    comments: 0,
  });

  return { total: counts.comments, changes:counts.changes};
}

const maxCommentsCR = async (changes) => {
  const allComments = await Promise.all(changes.map(change => getComments(change)));

  const maxComment = allComments.reduce((acc, {change, comments}) => {
    const commentCount = Object.values(comments).flat().length;

    if (commentCount > acc.count) {
      return {
        count: commentCount,
        url: baseURL + `/c/${change.project}/+/${change._number}`,
        id: change.change_id,
      };
    }
    return acc;
  }, { count: 0, url: '', id: '' });

  return maxComment;
}

const formatTime = (time) => {
  let seconds = Math.floor(time / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;

  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
};

const getLongestandShortestChange = (changes) => {
  let longest = changes[0];
  let ltime = null;
  let shortest = changes[0];
  let stime = null;

  changes.forEach(change => {
    if(change.status === "MERGED"){
      let submitted = new Date(change.submitted);
      let created = new Date(change.created); 
      let time = submitted - created;
      if(ltime === null || time > ltime){
        ltime = time;
        longest = change;
      }
      if(stime === null || time < stime){
        stime = time;
        shortest = change;
      }
    }
  })

  let lurl = baseURL + `/c/${longest?.project}/+/${longest?._number}`
  let surl = baseURL + `/c/${shortest?.project}/+/${shortest?._number}`

  return {longest: {id: longest?.change_id,url: lurl, time: formatTime(ltime)}, shortest: {id: shortest?.change_id,url: surl, time: formatTime(stime)}};
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

const getUserStats = async (id, startDate, endDate) => {
  const userId = id;

  const [ownChanges, reviewChanges] = await Promise.all(
    [
      getChanges(userId,startDate,endDate),
      getReviews(userId,startDate,endDate)
    ]
  );

  const ownChangesCount = ownChanges.length;
  const addedAsReviewer = reviewChanges.length;

  const [reviews, comments, reviewedChanges] = await Promise.all([
    codeReviews(ownChanges),
    totalCommentsRecieved(ownChanges),
    codeReviewed(reviewChanges, userId)
  ]);

  const totalComments = comments.total;
  const changes = comments.changes;

  return {
    userId,
    ownChangesCount,
    addedAsReviewer,
    reviews,
    comments: {total: totalComments, changes},
    reviewedChanges,
  }
}

const getCrStats = async (id, startDate, endDate) => {
  const userId = id;

  const [ownChanges] = await Promise.all(
    [
      getChanges(userId,startDate,endDate)
    ]
  );

  const [maxComments, longestAndShortest] = await Promise.all([
    maxCommentsCR(ownChanges),
    getLongestandShortestChange(ownChanges)
  ]);

  return {
    userId, 
    maxComments,
    longestAndShortest
  }  
}

const getOpenCrs = async (id) => {
  const openChanges = await getOpenChanges(id);
  const oldestOpenChanges = oldestChanges(openChanges);

  return oldestOpenChanges;
}

const getGraphStats = async (id, startDate, endDate) => {
  const reviewChanges = await getReviews(id, startDate, endDate);

  const getReviewsByDay = await reviewsByFilter(reviewChanges, id);

  return getReviewsByDay;
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

  const [reviews, comments, reviewedChanges, oldestOpenChanges, longestAndShortest] = await Promise.all([
    codeReviews(ownChanges),
    totalCommentsRecieved(ownChanges),
    codeReviewed(reviewChanges, userId),
    oldestChanges(openChanges),
    getLongestandShortestChange(ownChanges)
  ]);

  const totalComments = comments.total;
  const maxComments = comments.maxComment;
  const changes = comments.changes;

  const commentsPerChange = totalComments / (ownChangesCount ? ownChangesCount : 1);

  const result = {
    userId,
    ownChangesCount,
    addedAsReviewer,
    reviews,
    comments: {total: totalComments, changes},
    maxComments,
    reviewedChanges,
    oldestOpenChanges,
    commentsPerChange,
    longestAndShortest
  }

  return result;
}

module.exports = { getChanges, getReviews, getUserData, getUserStats, getCrStats, getOpenCrs, getGraphStats }
