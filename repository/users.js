const User = require('../model/user');

const findById = async id => {
  return await User.findById(id);
};

const findByEmail = async email => {
  return await User.findOne({ email });
};

const createUser = async credentials => {
  const user = new User(credentials);

  return await user.save();
};

const updateToken = async (id, token) => {
  return await User.updateOne({ _id: id }, { token });
};

const updateTokenVerify = async (id, isVerified, verifyToken) => {
  return await User.updateOne({ _id: id }, { isVerified, verifyToken });
};

const findUserByVerifyToken = async verifyToken => {
  return await User.findOne({ verifyToken });
};

const updateAvatar = async (id, avatar) => {
  return await User.updateOne({ _id: id }, { avatar });
};

module.exports = {
  findById,
  findByEmail,
  createUser,
  updateToken,
  updateTokenVerify,
  updateAvatar,
  findUserByVerifyToken,
};
