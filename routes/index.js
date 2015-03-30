var mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Board = mongoose.model('Board'),
	Ticket = mongoose.model('Ticket'),
	Event = mongoose.model('Event');

var stats = require('../scripts/stats');
var omatUtils = require('../scripts/utils');
var middlewares = require('../middlewares/middleware');
var multer = require('multer');
var fs = require('fs');

module.exports = function (app) {

  app.get('*', middlewares.sidepanelStatistics);

  app.get('/', function (req, res) {
    res.render('index', {partial : 'partials/overview'});
  });

  app.get('/overview', function (req, res) {
    res.render('index', {partial : 'partials/overview'});
  });

  app.get('/users', function (req, res) {

    var userBoardCount = [],
		userTicketCount = [],
		userActionCount = []; //lankkujen määrä per käyttäjä
    var usersInDB; //käyttäjien määrä db:ssä
    var done= 0; //laskuri, jolla varmistetaan että asynkroninen funktio ei jää kesken
    var hakuehto = '*';
    User.find(hakuehto, function(err, u) {

      console.log('haettiin kaikkia käyttäjäjiä ');
      done = -3*u.length+3;
      usersInDB = u;

      for(var i = 0; i < u.length; i++) {
        //lasketaan lankkujen määrä per nuppi
        Board.count({createdBy: u[i]._id}, function(err, count) {
          userBoardCount.push(count);
          done++;
         });
        Event.count({user : u[i]._id}, function(err, count) {
			userActionCount.push(count);
			done++;
		});
		Event.count({user : u[i]._id, type : 'TICKET_CREATE'}, function (err, count) {

				userTicketCount.push(count);
				done++;

				renderToScreen();
		});
	}
    });

    function renderToScreen() {
      if (done > 0) res.render('index', {users: usersInDB, boards: userBoardCount, tickets: userTicketCount, actions : userActionCount, partial : 'partials/users'});
    };

  });

  app.get('/boards', function (req, res) {

      var boardTicketCount = []; //lippujen määrä per lankku
      var authorsName = []; //lankun luojan nimi, pitää hakea erikseen
      var boardsInDB = []; //kaikki lankut databsessa
      var done = 0; //laskuri, jolla varmistetaan että asynkroninen funktio ei jää kesken
      var hakuehto = '*';
      Board.find(hakuehto, function(err, u) {

        console.log('haettiin kaikkia boardeja');
        done = -2*u.length+2;  //for loopin sisällä kaksi async-funktiota, siksi 2x kerroin.
        boardsInDB = u;

        for(var i = 0; i < u.length; i++){
          //lasketaan tikettien määrä per lankku
          Ticket.count({board: u[i]._id}, function(err, count){
            boardTicketCount.push(count);
            done++; //
          });
          //ja lisäksi haetaan lankun luojan email erikseen
          User.findOne({_id: u[i].createdBy}, function(err, user){
            console.log(user.email);
            authorsName.push(user.email);
            done++;
            renderToScreen();
          });
        }
      });

      function renderToScreen() {
        if (done > 0) res.render('index', {guestCount: "sinä", boards: boardsInDB, tickets: boardTicketCount, boardAuthor: authorsName, partial : 'partials/boards'});
      }
  });

  app.get('/databases', function (req, res) {

	var done = -2;
	var dbData = [];

	User.count({}, function(err, count) {
		dbData[0] = {title:'Users', value :'user', rowCount : count, rowMaxCount : stats.userDbMaxLoad, load : (count/stats.userDbMaxLoad)*100.0};
		done++;

		renderToScreen();
	});

	Board.count({}, function(err, count) {
		dbData[1] = {title:'Boards', value:'board', rowCount : count, rowMaxCount : stats.boardDbMaxLoad, load : (count/stats.boardDbMaxLoad)*100.0};
		done++;

		renderToScreen();
	});

	User.count({}, function(err, count) {
		dbData[2] = {title:'Tickets', value:'ticket', rowCount : count, rowMaxCount : stats.ticketDbMaxLoad, load : (count/stats.ticketDbMaxLoad)*100.0};
		done++;

		renderToScreen();
	});

    function renderToScreen() {
        if (done > 0) res.render('index', {dbs : dbData, partial : 'partials/databases'});
      }
  });

  app.get('/testi', function(req, res){
//      var testi = getUsers();

    var kayttajat = middlewares.getUsers(req, res, function(err, result){

      var id = [];
      for(var i=0; i<result.length; i++){
         id.push(result[i]._id);
          console.log(id[i]);
      }
        res.send("moro:D");
    }
    );

  });



  app.get('/user/:email', function(req, res) {

      var email;
      if (req.params.email == '*') email = {};
      else email = {email:req.params.email};

      User.find(email, function(err, u) {

          console.log('haettiin käyttäjiä emaililla %s', req.params.email);
          res.json(u);
          //res.status(200).send('{"count":'+count+',"maxCount":'+stats.userDbmaxLoad+'}');

      });

  });

  app.get('/board/:name', function(req, res) {
    /*
      sleepy sleepers - järkee vai ei
    */

      var name;
      if (req.params.name == '*') id = {};
      else name = {name: req.params.name};

      Board.find(name, function(err, u) {

          console.log('haettiin lautaa nimellä %s', req.params.name);
          res.json(u);
          //res.status(200).send('{"count":'+count+',"maxCount":'+stats.userDbmaxLoad+'}');

      });

  });

  app.get('/usercount', function(req, res) {

      User.count({}, function(err, count) {

			res.setHeader("Content-type", "application/javascript");
          res.status(200).send('{"count":'+count+',"maxCount":'+stats.userDbmaxLoad+'}');

      });

  });

  app.get('/generate/:count', function(req, res) {
    var c = (req.params.count === '*' ? 50 : req.params.count);
	populateData(c, "user");
    res.status(200).send("generaatiosivu :: "+c+" käyttäjää");
  });

  app.get('/generateboards/:count', function(req, res){
    var c = (req.params.count === '*' ? 50 : req.params.count);

    User.find('*', function(err, u) {

      var kayttajat = [];

      for(var i = 0; i < u.length; i++){
        kayttajat.push(u[i]._id);
      }

      populateData(c, "board", kayttajat);

    });

    res.status(200).send("generaatiosivu :: "+c+" lautaa");
  });

  app.get('/generatetickets/:count', function(req, res){
    var c = (req.params.count === '*' ? 50 : req.params.count);

    Board.find('*', function(err, u) {

      var boards = [];

      for(var i = 0; i < u.length; i++){
        boards.push(u[i]._id);
      }

      populateData(c, "ticket", boards);

    });

    res.status(200).send("generaatiosivu :: "+c+" tikettiä");
  });

 app.get('/backup/:db', function(req, res) {

		var now = new Date(), filename, arr = {};

		switch(req.params.db) {
			case 'user' :

			User.find({}, function(err, u) {

				arr['db'] = 'user';
				arr['title'] = 'db.'+arr['db'];
				arr['creator'] = 'adm1n';
				arr['date'] = now.toISOString();
				arr['comments'] = 'weekly backup... herp derp. Ö_ö';
				arr['rowCount'] = u.length;
				arr['data'] = JSON.stringify(u);

				filename = arr['title']+'.'+now.getDate()+'.'+(now.getMonth()+1)+'.'+now.getFullYear()+'.json';

				res.setHeader("Content-type", "application/javascript; charset=utf-8");
				res.setHeader("Content-Disposition", 'attachment; filename="'+filename+'"');
				res.status(200).send(JSON.stringify(arr));

			});

			break;
			default:

				res.status(200).send('*toistaiseksi vain User-dokumentin voi käsitellä*');

			break;
		}

});

app.get('/restore', function(req, res) {

     res.render('index', {partial : 'partials/restore'});

});

app.post('/restoreapi', function(req, res, next) {
//if (app.get('uploadFinished') == true) {
         //console.log(req.files);
	if (req.files) {
		//~ console.log(util.inspect(req.files));
		//~ if (req.files.db.size === 0) {
		            //~ return next(new Error("Hey, first would you select a file?"));
		//~ }

		fs.exists(req.files.db.path, function(exists) {

			if (exists) {
				console.log('löytyy');
				fs.readFile('./'+req.files.db.path, 'utf8', function(err, data) {

					if (err) done(err);

					 //res.status(200).send('LUETTIIN TIEDOSTOSTA: '+data);
					var arr = JSON.parse(data), db = JSON.parse(arr['data']);

					switch(arr['db']) {
						case 'user':

							User.collection.insert(db, function(err, docs) {

								if (err) return done(err);

								res.status(200).send(docs.length+' käyttäjää lisättiin!');

							});

						break;
					}

				});
			}

		});
	}

});

}

/*var findData = function(mail) {

	console.log('* etsitään käyttäjää, jonka email = '+mail+'...');
	var userData = {};
	User.findOne({ 'email': mail }, 'email password token', function (err, u) {

		if (err) return done(err);

		if (u) {
			//userData[u.email] = u;
			console.log('USER:\t%s\t%s\t(%s)', u.email, u.password, u.token);
		}

	});

	/*if (userData[0]) {
		for(var i in userData) {
			if (userData.hasOwnProperty(i)) {
				u = userData[i];
				console.log('USER:\t%s\t%s\t(%s)', u.email, u.password, u.token);
			}
		}
	}
	else {
		console.info(mail, 'ei löytynyt kannasta :\'(');
	}*

	done();

};*/

var populateData = function(count, schema, Array) {

	console.log('lisätään %d riviä...', count);

	//var callback = arguments[0], cbEmail = arguments[1];

	//var data = [];
	for(var i = 0; i < count; i++) {
		//data.push({email:mail, password:'f00b4r?!'});

        if(schema == "user")
          var d = new User(omatUtils.generateRandomUserData());
        else if(schema == "board")
          var d = new Board(omatUtils.generateRandomBoard(Array));
        else if(schema == "ticket")
          var d = new Ticket(omatUtils.generateRandomTicket(Array));

		d.save(function (err, u) {

			if (err) return done(err);
			else console.log('%s lisätty :: _id=%s', u.email, u._id);
			//console.log(u);
			//console.log('* kaikki lisätty :)');
			//User.save();
//			callback(cbEmail);

		});
	}
};

function done(err) {

  if (err) console.error(err);

  //User.remove(function () { Board.remove(function () { mongoose.disconnect(); }) });

  //mongoose.disconnect();

};
