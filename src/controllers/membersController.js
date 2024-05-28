const { getMembers, getMember } = require('../utils/membersUtil');

const getMembersByGroupName = async (req, res) => {
  const groupName = req.query.groupName;
  if(!groupName) return res.status(400).send({ message: 'groupName is required' });
  try {
    const members = await getMembers(groupName);
    if(!members) return res.status(404).send({ message: 'Members not found' });
    res.status(200).send(members);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

const getMemberDetails = async (req, res) => {
  const name = req.params.extId;
  if(!name) return res.status(400).send({ message: 'Name is required' });
  try {
    const member = await getMember(name);
    if(!member) return res.status(404).send({ message: 'Member not found' });
    res.status(200).send(member);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
}

module.exports = { getMembersByGroupName, getMemberDetails }