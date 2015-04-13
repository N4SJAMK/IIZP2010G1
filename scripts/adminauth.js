var auth = require('basic-auth');

var admins = {

  'adm1n' : { pass: 'iz7heBestest' }

};

module.exports = function(req, res, next) {

	var user = auth(req);

	if (!user || !admins[user.name] || admins[user.name].pass !== user.pass) {
		res.set('WWW-Authenticate', 'Basic realm="contriboard admin panel"');

		var html = '<!DOCTYPE html><html lang="en"><head><title>Admin Panel | Login to use</title><link href="//fonts.googleapis.com/css?family=Lobster" rel="stylesheet" type="text/css"><link href="//fonts.googleapis.com/css?family=Lato" rel="stylesheet" type="text/css"><style> body { background: #221a26; color: white; text-align: center; } .logo { margin: auto 0; font-family: \'Lobster\', \'Helvetica\', \'Arial\', sans-serif; } </style></head><body><div class="logo center"><h1><img src="//n4sjamk.github.io/contriboard/images/contriboard_logo_white.svg"><h2>Admin Panel | Login to use</h2></div></body></html>';
		res.status(401).send(html);
		//res.render('login');
	}

	return next();

};