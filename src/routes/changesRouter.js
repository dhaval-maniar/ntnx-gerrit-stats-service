const { Router } = require('express');

const { getChangesByOwner, getChangesByReviewer, getUserChanges, getUserStatistics } = require('../controllers/changesController');

const app = Router();

app.get('/owner/:extId',getChangesByOwner);

app.get('/reviewer/:extId',getChangesByReviewer);

app.get('/:extId', getUserChanges);

app.get('/stats/:extId', getUserStatistics);

module.exports = app;
