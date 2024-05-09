const { Router } = require('express');

const { getMembersByGroupName } = require('../controllers/gerritcontroller');

const app = Router();

app.get('/members', getMembersByGroupName)

module.exports = app;