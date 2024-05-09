const axios = require('axios');
const https = require('https');
require('dotenv/config');

const baseURL = "https://gerrit.eng.nutanix.com";
const username = process.env.GERRIT_USERNAME;
const password = process.env.GERRIT_PASSWORD;

const agent = new https.Agent({  
  rejectUnauthorized: false
});

const getMembers = async (groupName) => {
  try {
    const response  = await axios.get(baseURL + `/a/groups/?r=${groupName}&o=MEMBERS`, {
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
    const members = parsedData[groupName].members; 
    return members;
  } catch (error) {
    console.log(error);
    return null;
  }
}

module.exports = { getMembers }