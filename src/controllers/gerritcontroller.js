const { getMembers } = require('../utils/membersUtil');

const getMembersByGroupName = async (req, res) => {
  const groupName = req.query.groupName;
  if(!groupName) return res.status(400).send({ message: 'groupName is required' });
  try {
    const members = await getMembers(groupName);
    res.status(200).send(members);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

module.exports = { getMembersByGroupName }