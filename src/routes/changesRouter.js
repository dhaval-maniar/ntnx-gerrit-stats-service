const { Router } = require('express');

const { getChangesByOwner, getChangesByReviewer, getUserChanges, getUserStatistics, getCrStatistics, getOpenChanges } = require('../controllers/changesController');

const app = Router();

app.get('/owner/:extId',getChangesByOwner);

app.get('/reviewer/:extId',getChangesByReviewer);

app.get('/:extId', getUserChanges);

app.get('/stats/:extId', getUserStatistics);

app.get('/crStats/:extId', getCrStatistics);

app.get('/openChanges/:extId', getOpenChanges);

module.exports = app;
