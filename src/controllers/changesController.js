const { getChanges, getReviews, getUserData, getUserStats } = require('../utils/changesUtil');

const getChangesByOwner = async (req, res) => {
  const owner = req.params.extId;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate; 
  if(!owner) return res.status(400).send({ message: 'Owner Id is required' });
  try {
    const changes = await getChanges(owner,startDate,endDate);
    if(!changes) return res.status(404).send({ message: 'Changes not found' });
    res.status(200).send(changes);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

const getChangesByReviewer = async (req, res) => {
  const reviewer = req.params.extId;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  if(!reviewer) return res.status(400).send({ message: 'Reviewer Id is required' });
  try {
    const changes = await getReviews(reviewer, startDate, endDate);
    if(!changes) return res.status(404).send({ message: 'Changes not found' });
    res.status(200).send(changes);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

const getUserChanges = async (req, res) => {
  const userId = req.params.extId;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  if(!userId) return res.status(400).send({ message: 'User Id is required' });
  try {
    const changes = await getUserData(userId, startDate, endDate);
    if(!changes) return res.status(404).send({ message: 'Changes not found' });
    res.status(200).send(changes);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

const getUserStatistics = async (req, res) => {
  const userId = req.params.extId;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  if(!userId) return res.status(400).send({ message: 'User Id is required' });
  try {
    const changes = await getUserStats(userId, startDate, endDate);
    if(!changes) return res.status(404).send({ message: 'Changes not found' });
    res.status(200).send(changes);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

module.exports = { getChangesByOwner, getChangesByReviewer, getUserChanges, getUserStatistics }