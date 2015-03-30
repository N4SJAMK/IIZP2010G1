'use strict';

var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var utils = require('utils');

var UserSchema = new mongoose.Schema({

	email: { type: String, match: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, unique: true, required: true },
	password: { type: String, required: true },
	token: { type: String }

});

if (!UserSchema.options.toJSON) UserSchema.options.toJSON = {};
if (!UserSchema.options.toObject) UserSchema.options.toObject = {};

UserSchema.options.toJSON.transform = function(doc, ret) { return { 'id': doc.id, 'type': 'user', 'username': doc.email } };

UserSchema.path('password').validate(function() {
	var user = this;
	if (!user.isModified('password')) { return true; }

	return /^[a-zA-Z0-9!"#$%&'()*+,-.\/:;<=>?@\[\]^_`{|}~]{8,36}$/.test(user.password);
}, null);

UserSchema.pre('save', function hashPassword(next) {
	var user = this;

	if (!user.isModified('password')) { return next(); }


	return next();
	/*var SALT_FACTOR = 10;

	bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
		if (err) { return next(utils.error(500, err)); }

		bcrypt.hash(user.password, salt, function(err, hash) {
			if(err) { return next(utils.error(500, err)); }

			user.password = hash;
			return next();
		});
	});*/
});

UserSchema.methods.comparePassword = function(password, callback) {
	bcrypt.compare(password, this.password, callback);
}

module.exports = UserSchema;