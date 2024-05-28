const { Router } = require('express');

const { getMembersByGroupName, getMemberDetails } = require('../controllers/membersController');

const app = Router();

app.get('/', getMembersByGroupName)

app.get('/:extId', getMemberDetails)

module.exports = app;