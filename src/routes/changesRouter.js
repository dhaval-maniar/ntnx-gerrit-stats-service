const { Router } = require('express');

const { getChangesByOwner, getChangesByReviewer, getUserChanges } = require('../controllers/changesController');

const app = Router();

app.get('/owner/:extId',getChangesByOwner);

app.get('/reviewer/:extId',getChangesByReviewer);

app.get('/:extId', getUserChanges);

module.exports = app;
