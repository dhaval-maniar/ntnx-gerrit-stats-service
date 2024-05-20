const { getChanges } = require('../utils/changesUtil');

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

module.exports = { getChangesByOwner }