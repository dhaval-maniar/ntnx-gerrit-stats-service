const { Router } = require('express');

const { getMembersByGroupName } = require('../controllers/membersController');

const app = Router();

app.get('/', getMembersByGroupName)

module.exports = app;