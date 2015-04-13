var loginInfo = {
		service: 'gmail',
		auth: {
			user: 'niko.jokipalo@gmail.com',
			pass: '*******'
		}
	};

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(nodemailer.loginInfo);

module.exports.nodemailer = nodemailer;
module.exports.transporter = transporter;
