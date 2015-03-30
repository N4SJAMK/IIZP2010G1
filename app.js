var mongoose = require('mongoose');
var BoardSchema = require('./models/schema.board'), Board = mongoose.model('Board', BoardSchema),
	UserSchema = require('./models/schema.user'), User = mongoose.model('User', UserSchema),
	TicketSchema = require('./models/schema.ticket'), Ticket = mongoose.model('Ticket', TicketSchema),
	EventSchema = require('./models/schema.event'), Event = mongoose.model('Event', EventSchema);

var express = require('express');
//var http = require('http');
var path = require('path');
var routes = require('./routes');
var multer = require('multer');
var bodyParser = require('body-parser');
var fs = require('fs');

mongoose.connect('mongodb://localhost/contriboard', function (err) {

  if (err) throw err;

  console.log('* Now connected to database.');

});

var app = express();
//app.use(bodyParser.json());
//var server = http.createServer(app);
routes(app);
//app.set('uploadFinished', false);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({
	dest: './uploads/',
	rename: function (fieldname, filename) { return filename+Date.now(); },
	onFileUploadStart: function (file) { console.log(file.originalname + ' is starting...'); },
	onFileUploadComplete: function (file) { console.log(file.fieldname + ' uploaded to ' + file.path); /*app.set('uploadFinished', true);*/ },
	onError: function (error, next) { console.log(error); next(error); }
}));

//view engine and default folder for views
app.set('port', process.env.PORT || 8080);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(app.get('port'), function() {
  console.log("* Admin panel is now listening on port %d.", app.get('port'));
});