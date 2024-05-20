const { Router } = require('express');

const { getChangesByOwner } = require('../controllers/changesController');

const app = Router();

app.get('/owner/:extId',getChangesByOwner);

module.exports = app;
