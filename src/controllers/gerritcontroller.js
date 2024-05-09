const axios = require('axios');
const https = require('https');
const { parse } = require('path');
require('dotenv/config');

const baseURL = "https://gerrit.eng.nutanix.com";
const username = process.env.GERRIT_USERNAME;
const password = process.env.GERRIT_PASSWORD;

const agent = new https.Agent({  
  rejectUnauthorized: false
});

const test = async (req, res) => {
    try {
      const response  = await axios.get(baseURL + '/a/groups/?r=compute-ui&o=MEMBERS', {
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
      const members = parsedData['compute-ui'].members; 
      res.status(200).send(members);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: 'Internal Server Error' });
    }
}

module.exports = { test }