var AsToken = require('as-token');
var debug = require('debug')('authentication');
var param = require('swagger-node-express/Common/node/paramTypes.js');
var sequelize = require('sequelize');
var util = require('util');

var User = require('../models/user');

/**
 * Log in
 * @param  {Request} req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.postLogin = {
  spec: {
    path: '/authentication/login',
    description: 'Operations about authentication',
    notes: 'Requests Logs in',
    summary: 'Retrieves Logs in',
    method: 'POST',
    parameters: [
      param.form('username', 'username of the user', 'string'),
      {
        name: 'password',
        description: 'password of the user',
        type: 'string',
        format: 'password',
        minLength: 8,
        required: true,
        paramType: 'form'
      },
      param.form('client_id', 'client_id of the application', 'string'),
      param.form('redirect', 'requested redirect after registration', 'string'),
      param.form('redirect_uri', 'requested redirect_uri after registration', 'string')
    ],
    responseClass: 'User',
    errorResponses: [],
    nickname: 'postLogin'
  },
  action: function postLogin(req, res, next) {
    console.log('postLogin req.body', req.body);
    console.log('postLogin req.query', req.query);
    User.verifyPassword({
      password: req.body.password,
      username: req.body.username
    }, function (err, user) {
      if (err) {
        debug('error logging in', err, user);
        err.status = 403;
        // the error handler will send cleaned json which can be displayed to the user
        return next(err, req, res, next);
      }

      delete user.hash;
      delete user.deletedAt;
      delete user.deletedReason;
      var token = AsToken.sign(user, 60 * 24);
      debug('token', token);
      res.set('Set-Cookie', 'Authorization=Bearer ' + token + '; path=/; Secure; HttpOnly');
      res.set('Authorization', 'Bearer ' + token);

      var path = req.body.redirect
        || util.format('%s?client_id=%s&redirect_uri=%s',
          '/oauth2/authorize',
          req.body.client_id,
          req.body.redirect_uri);

      return res.redirect(path);
    });
  }
};

exports.getLogout = {
  spec: {
    path: '/logout',
    description: 'Operations about authentication',
    notes: 'Logs user out',
    summary: 'Logs user out',
    method: 'GET',
    parameters: [
      param.query('redirect', 'requested redirect after logout', 'string')
    ],
    responseClass: 'User',
    errorResponses: [],
    nickname: 'getLogout'
  },
  action: function getLogout(req, res, next) {
    res.set('Set-Cookie', 'Authorization=null; path=/; Secure; HttpOnly');
    res.set('Authorization', 'null');
    res.redirect(req.query.redirect || '/authentication/login');
  }
};

/**
 * Register or Signup using the local strategy
 * @param  {Request} req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.postRegister = {
  spec: {
    path: '/authentication/register',
    description: 'Operations about authentication',
    notes: 'Registers a user',
    summary: 'Registers a user',
    method: 'POST',
    parameters: [
      param.form('username', 'requested username of the user', 'string'),
      {
        name: 'password',
        description: 'password of the user',
        type: 'string',
        format: 'password',
        minLength: 8,
        required: true,
        paramType: 'form'
      },
      {
        name: 'confirmPassword',
        description: 'confirm password of the user',
        type: 'string',
        format: 'password',
        minLength: 8,
        required: true,
        paramType: 'form'
      },
      param.form('client_id', 'client_id of the application', 'string'),
      param.form('redirect', 'requested redirect after registration', 'string'),
      param.form('redirect_uri', 'requested redirect_uri after registration', 'string')
    ],
    responseClass: 'User',
    errorResponses: [],
    nickname: 'postRegister'
  },
  action: function postRegister(req, res, next) {
    var err;

    if (!req.body || !req.body.username || req.body.username.length < 4) {
      err = new Error('Please provide a username which is 4 characters or longer '
        + 'and a password which is 8 characters or longer');
      err.status = 403;
      return next(err, req, res, next);
    }

    if (!req.body || !req.body.password || req.body.password.length < 8) {
      err = new Error('Please provide a password which is 8 characters or longer');
      err.status = 403;
      return next(err, req, res, next);
    }

    User.create(req.body, function (err, user) {
      if (err) {
        debug('Error registering the user', err, user);

        if (err instanceof sequelize.UniqueConstraintError
          && err.fields && err.fields.indexOf('username') > -1) {
          err = new Error('Username ' + req.body.username + ' is already taken,'
            + ' please try another username');
          err.status = 403;
        }

        // the error handler will send cleaned json which can be displayed to the user
        return next(err, req, res, next);
      }
      // Successful logins should send the user back to /oauth2/authorize.
      var path = req.body.redirect
        || util.format('%s?client_id=%s&redirect_uri=%s',
          '/oauth2/authorize',
          req.body.client_id,
          req.body.redirect_uri);

      var token = AsToken.sign(user, 60 * 24);
      debug('token', token);
      res.set('Set-Cookie', 'Authorization=Bearer ' + token + '; path=/; Secure; HttpOnly');
      res.set('Authorization', 'Bearer ' + token);

      return res.redirect(path);
    });
  }
};

