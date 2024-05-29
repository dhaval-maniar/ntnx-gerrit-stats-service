const { getChanges, getReviews, getUserData } = require('../utils/changesUtil');

const getChangesByOwner = async (req, res) => {
  const owner = req.params.extId;
  if(!owner) return res.status(400).send({ message: 'Owner Id is required' });
  try {
    const changes = await getChanges(owner);
    if(!changes) return res.status(404).send({ message: 'Changes not found' });
    res.status(200).send(changes);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

const getChangesByReviewer = async (req, res) => {
  const reviewer = req.params.extId;
  if(!reviewer) return res.status(400).send({ message: 'Reviewer Id is required' });
  try {
    const changes = await getReviews(reviewer);
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

module.exports = { getChangesByOwner, getChangesByReviewer, getUserChanges }