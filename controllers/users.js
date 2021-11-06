const Users = require('../repository/users');
const jwt = require('jsonwebtoken');
// const fs = require ('fs/promises')
const path = require('path');
const UploadService = require('../services/fileUpload');
require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET_KEY;
const { HttpCode } = require('../config/constants');
const mkdirp = require('mkdirp');
const EmailService = require('../services/email/service');
const {
  CreateSenderSendGrid,
  CreateSenderNodemailer,
} = require('../services/email/sender');

const {
  OK,
  CREATED,
  ACCEPTED,
  NO_CONTENT,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
} = HttpCode;

const registration = async (req, res, next) => {
  const { name, email, password, subscription } = req.body;
  const user = await Users.findByEmail(email);

  if (user) {
    return res.status(CONFLICT).json({
      status: 'error',
      code: CONFLICT,
      message: 'Email is use',
    });
  }

  try {
    const newUser = await Users.createUser({
      name,
      email,
      password,
      subscription,
    });

    const emailServise = new EmailService(
      process.env.NODE_ENV,
      new CreateSenderSendGrid(),
    );

    const statusEmail = await emailServise.sendVerifyEmail(
      newUser.email,
      newUser.name,
      newUser.verifyToken,
    );

    return res.status(CREATED).json({
      status: 'success',
      code: CREATED,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
        successEmail: statusEmail,
      },
    });
  } catch (error) {
    next(error);
  }

  res.json();
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await Users.findByEmail(email);
  const isValidPassword = await user?.isValidPassword(password);

  if (!user || !isValidPassword || !user?.isVerified) {
    return res.status(UNAUTHORIZED).json({
      status: 'error',
      code: UNAUTHORIZED,
      message: 'Invalid login or password',
    });
  }
  const id = user._id;
  const payload = { id };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  await Users.updateToken(id, token);

  return res.status(OK).json({
    status: 'success',
    code: OK,
    data: {
      token,
    },
  });
};

const logout = async (req, res, next) => {
  const id = req.user._id;
  await Users.updateToken(id, null);
  return res.status(NO_CONTENT).json();
};

const getCurrentUser = async (req, res, next) => {
  const { email, subscription } = req.user;
  return res.status(OK).json({
    status: 'success',
    code: OK,
    data: { email, subscription },
  });
};

const uploadAvatar = async (req, res, next) => {
  const id = String(req.user._id);
  const file = req.file;
  const AVATAR_OF_USERS = process.env.AVATAR_OF_USERS;
  const destination = path.join(AVATAR_OF_USERS, id);
  await mkdirp(destination);
  const uploadService = new UploadService(destination);
  const avatarURL = await uploadService.save(file, id);
  await Users.updateAvatar(id, avatarURL);

  return res.status(OK).json({
    status: 'success',
    code: OK,
    data: { avatarURL },
  });
};

const verifyUser = async (req, res, next) => {
  try {
    const user = await Users.findUserByVerifyToken(req.params.token);
    if (user) {
      await Users.updateTokenVerify(user._id, true, null);
      return res.status(OK).json({
        status: 'success',
        code: OK,
        data: {
          message: 'Success',
        },
      });
    }
    return res.status(BAD_REQUEST).json({
      status: 'error',
      code: BAD_REQUEST,
      message: 'Invalid token',
    });
  } catch (error) {}
};

const repeatEmailForVerifyUser = async (req, res, next) => {
  const { email } = req.body;
  const user = await Users.findByEmail(email);

  if (user) {
    const { email, name, verifyToken } = user;
    const emailServise = new EmailService(
      process.env.NODE_ENV,
      new CreateSenderNodemailer(),
    );

    const statusEmail = await emailServise.sendVerifyEmail(
      email,
      name,
      verifyToken,
    );
  }
  
  return res.status(OK).json({
    status: 'success',
    code: OK,
    data: {
      message: 'Success',
    },
  });
};

module.exports = {
  registration,
  login,
  logout,
  getCurrentUser,
  uploadAvatar,
  verifyUser,
  repeatEmailForVerifyUser,
};
