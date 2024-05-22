const { Router } = require('express');

const { getChangesByOwner, getChangesByReviewer } = require('../controllers/changesController');

const app = Router();

app.get('/owner/:extId',getChangesByOwner);

app.get('/reviewer/:extId',getChangesByReviewer);

module.exports = app;
