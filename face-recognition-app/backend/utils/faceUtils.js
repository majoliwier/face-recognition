const User = require("../models/User");

async function findMatchingUserMock() {
  const user = await User.findOne();
  return user || null;
}

module.exports = { findMatchingUserMock };
