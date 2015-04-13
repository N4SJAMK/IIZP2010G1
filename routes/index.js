var mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Board = mongoose.model('Board'),
	Ticket = mongoose.model('Ticket'),
	Event = mongoose.model('Event'),
	Announcement = mongoose.model('Announcement');

var stats = require('../scripts/stats');
var omatUtils = require('../scripts/utils');

var mailer = require('../scripts/mailer');

var middlewares = require('../middlewares/middleware');
var multer = require('multer');
var fs = require('fs');

module.exports = function (app) {

  app.get('*', middlewares.sidepanelStatistics);

  app.get('/', function(req,res){

    var eventsByPerson = [],
        userBoardCount = new Array(10),
        userNames = new Array(10),
        userTicketCount = new Array(10);

    var eventsByBoard = [],
        boardOwnerNames = new Array(10),
        boardNames = new Array(10),
        boardTicketCount = new Array(10),
        boardGuestCount = new Array(10);

    var done = 0;

    middlewares.getEventsByPerson(req, res, function(err, events){
			console.log(events.length);

			if(events[0] == null)
				renderToScreen();

      if(err)
        return(err);

      eventsByPerson = events;
      done += -2*events.length;

		function findUserData(i){ // siirsin ulos loopista jossa oli tarpeettomasti

          //lasketaan lankkujen määrä per nuppi
          Board.count({createdBy: events[i]._id}, function(err, count) {
            userBoardCount[i] = count;
            done++;
            renderToScreen();
           });

          //haetaan tarkasteltava henkilö, ja pistetään username/email muistiin
          User.findOne({_id: events[i]._id}, function(err, username){
			if (err || !username) return false;

            userNames[i] = username.email;

            //lasketaan käyttäjän tickettien määrä eventeistä
            Event.count({user: {id: events[i]._id, type: "user", username: userNames[i]}, type : 'TICKET_CREATE'}, function (err, count) {
                userTicketCount[i] = count;
                done++;
                renderToScreen();
            });

          });
        }

      for(var i = 0; i < events.length; i++){
        findUserData(i);
      }

    });


    middlewares.getEventsByBoard(req, res, function(err, events){
      if(err)
        return(err);

      eventsByBoard = events;
      done += -4*events.length;

      for(var i = 0; i < events.length; i++){

        function findBoardData(i){

          //haetaan tarkasteltava lauta
          Board.findOne({_id: events[i]._id}, function(err, board) {
            boardNames[i] = board.name;

            //haetaan laudan omistajan nimi
            User.findOne({_id: board.createdBy}, function(err, user){
              boardOwnerNames[i] = user.email;
              done++;
              renderToScreen();
            });

            //haetaan ticketit...
            Event.count({board: board._id, type : 'TICKET_CREATE'}, function(err, count){
              boardTicketCount[i] = count;
              done++;
              renderToScreen();
            });

            //... ja guestit 60 min ajalta
            Event.count({board : board._id, createdAt: {$gt: ((new Date) - 1000*60*60)}, type: "BOARD_GUEST_JOIN"}, function(err, count){
              boardGuestCount[i] = count;
              done++;
              renderToScreen();
            });

            done++;
            renderToScreen();
           });

        }

        findBoardData(i);

      }

    });

    function renderToScreen(){
      if(done == 0)
        res.render('index', {userEvents: eventsByPerson, userName: userNames, userBoards: userBoardCount, userTickets: userTicketCount, boardName: boardNames, boardOwner: boardOwnerNames, boardTickets: boardTicketCount, boardGuests: boardGuestCount, boardEvents: eventsByBoard, partial : 'partials/overview'});
    }
  });

  app.get('/users', function (req, res) {

    var userBoardCount = new Array(res.locals.userCount),
        userTicketCount = new Array(res.locals.userCount),
        userActionCount = new Array(res.locals.userCount),
        userIsBanned = new Array(res.locals.userCount),
        usersInDB;


    var done = 0;              //laskuri, jolla varmistetaan että asynkroninen funktio ei jää kesken
    var hakuehto = '*';
    User.find(hakuehto, function(err, u) {

      usersInDB = u;

			if(u[0] == null)
				renderToScreen();

      console.log('haettiin kaikkia käyttäjäjiä ');
      done = -3*u.length;

		function findUserData(i) {
			var b = new Date(u[i].banning.begin), e = new Date(u[i].banning.end);
			if (u[i].isBanned) userIsBanned[i] = (u[i].isBanned());

			if (userIsBanned[i]) {
				usersInDB[i].banningBegin = omatUtils.formatDate(b);
				usersInDB[i].banningEnd = omatUtils.formatDate(e);
				//console.log(usersInDB[i].banningBegin, usersInDB[i].banningEnd);
			}

          //lasketaan lankkujen määrä per nuppi
          Board.count({createdBy: u[i]._id}, function(err, count) {
            userBoardCount[i] = count;
            done++;
            renderToScreen();
           });
          //lasketaan kaikki eventit = actions
          Event.count({user: {id: u[i]._id, type: "user", username: u[i].email}, createdAt: {$gt: ((new Date) - 1000*60*60)}}, function(err, count) {
              userActionCount[i] = count;
              done++;
              renderToScreen();
          });
          //lasketaan tickettien määrä eventeistä
          Event.count({user: {id: u[i]._id, type: "user", username: u[i].email}, type : 'TICKET_CREATE'}, function (err, count) {
              userTicketCount[i] = count;
              done++;
              renderToScreen();
          });
        }

      for(var i = 0; i < u.length; i++) { findUserData(i); }

  });

    function renderToScreen() {
      if (done == 0) res.render('index', {users: usersInDB, boards: userBoardCount, tickets: userTicketCount, actions : userActionCount, banned : userIsBanned, bannedUser : (req.query.bannedUser || null), recoveredUser : (req.query.recoveredUser || null), sent : (req.query.sent || null), partial : 'partials/users'});
    };

  });

  app.get('/announcements', function(req, res) {

		var typesValues = Announcement.schema.paths.type.enumValues,
			levelsValues = Announcement.schema.paths.level.enumValues;

		Announcement.find({}, function(err, a) {

			if (err) console.log(err);

			for(var i = 0; i < a.length; i++) {
				a[i].visibleBegin = omatUtils.formatDate(a[i].visible.begin);
				a[i].visibleEnd = omatUtils.formatDate(a[i].visible.end);
			}

			res.render('index', {announcements : a, types : typesValues, levels : levelsValues, partial : 'partials/announcements'});

		});

	});

  app.get('/boards', function (req, res) {

      var boardTicketCount = new Array(res.locals.boardCount),   //lippujen määrä per lankku
          authorsName = new Array(res.locals.boardCount),        //lankun luojan nimi, pitää hakea erikseen
          boardEventCount = new Array(res.locals.boardCount),    //kaikki actionit lankussa
          boardGuestCount = new Array(res.locals.boardCount),    //guesteja liittynyt viimeisen tunnin aikana
          boardsInDB;                                            //kaikki lankut databsessa

      var done = 0;               //laskuri, jolla varmistetaan että asynkroninen funktio ei jää kesken
      var hakuehto = '*';
      Board.find(hakuehto, function(err, u) {

        boardsInDB = u;

				if(u[0] == null)
					renderToScreen();

        console.log('haettiin kaikkia boardeja');
        done = -4*u.length;   //for loopin sisällä kaksi async-funktiota, siksi 2x kerroin.

		function findBoardData(i) {

            //lasketaan tikettien määrä per lankku
            Ticket.count({board: u[i]._id}, function(err, count){
              boardTicketCount[i] = count;
              done++;
              renderToScreen();
            });
            //ja lisäksi haetaan lankun luojan email erikseen
            User.findOne({_id: u[i].createdBy}, function(err, user){
              authorsName[i] = user.email;
              done++;
              renderToScreen();
            });
            //actionit viimeisen tunnin aikana
            Event.count({board : u[i]._id, createdAt: {$gt: ((new Date) - 1000*60*60)}}, function (err, count) {
              boardEventCount[i] = count;
              done++;
              renderToScreen();
            });
            //guesteja liittynyt viimeisen tunnin aikana
            Event.count({board : u[i]._id, createdAt: {$gt: ((new Date) - 1000*60*60)}, type: "BOARD_GUEST_JOIN"}, function (err, count) {
              boardGuestCount[i] = count;
              done++;
              renderToScreen();
            });

          }

        for(var i = 0; i < u.length; i++) { findBoardData(i); }

      });

      function renderToScreen() {
        if (done == 0) res.render('index', {boards: boardsInDB, tickets: boardTicketCount, boardAuthor: authorsName, guests: boardGuestCount, events: boardEventCount, partial : 'partials/boards'});
      }
  });

  app.get('/databases', function (req, res) {

	var done = -4;
	var dbData = [];

	User.count({}, function(err, count) {
		dbData[0] = {title:'Users', value :'users', rowCount : count, rowMaxCount : stats.userDbMaxLoad, load : (count/stats.userDbMaxLoad)*100.0};
		done++;

		renderToScreen();
	});

	Board.count({}, function(err, count) {
		dbData[1] = {title:'Boards', value:'boards', rowCount : count, rowMaxCount : stats.boardDbMaxLoad, load : (count/stats.boardDbMaxLoad)*100.0};
		done++;

		renderToScreen();
	});

	Ticket.count({}, function(err, count) {
		dbData[2] = {title:'Tickets', value:'tickets', rowCount : count, rowMaxCount : stats.ticketDbMaxLoad, load : (count/stats.ticketDbMaxLoad)*100.0};
		done++;

		renderToScreen();
	});

	Event.count({}, function(err, count) {
		dbData[3] = {title:'Events', value:'events', rowCount : count, rowMaxCount : -1, load : -1};
		done++;

		renderToScreen();
	});

    function renderToScreen() {
        if (done == 0) res.render('index', {dbs : dbData, partial : 'partials/databases'});
      }
  });

  app.get('/user/:email', function(req, res) {

      var email;
      if (req.params.email == '*') email = {};
      else email = {email:req.params.email};
      var done;

      var totalBoards = 0,
          totalTickets = 0,
          boardNames,
          boardTickets,
          user;

      User.findOne(email, function(err, u) {

        user = u;
        console.log('haettiin käyttäjiä emaililla %s', req.params.email);

        Board.count({createdBy: u._id}, function(err, count){
          done = -(count+1);
          boardNames = new Array(count);
          boardTickets = new Array(count);
          totalBoards = count;

          Event.count({user: {id: u._id, type: "user", username: u.email}, type : 'TICKET_CREATE'}, function(err, count){
            totalTickets = count;
            done++;
            renderToScreen();
          });

          for(var i = 0; i < totalBoards; i++){

            function getBoardInfo(i){
              Board.find({createdBy: u._id}, function(err, result){
                boardNames[i] = result[i].name;

                Event.count({board: result[i]._id, type : 'TICKET_CREATE'}, function(err, count){
                  boardTickets[i] = count;
                  done++;
                  renderToScreen();
                });
              });
            }
            getBoardInfo(i);

          }

//          done++;
//          renderToScreen();
        });



//          res.json(u);
          //res.status(200).send('{"count":'+count+',"maxCount":'+stats.userDbmaxLoad+'}');

      });

    function renderToScreen(){
      if(done == 0) {
        res.render('index', {user: user, totalBoards: totalBoards, totalTickets: totalTickets, boardNames: boardNames, boardTickets: boardTickets, partial: 'partials/user'});
		console.log(user);
	}
   }

  });

  app.get('/board/:name', function(req, res) {

      var name;
      if (req.params.name == '*') id = {};
      else name = {name: req.params.name};

      var board,
          boardAuthor,
          createDate,
          boardTicketCount,
          done;


      Board.findOne(name, function(err, u) {
        console.log('haettiin lautaa nimellä %s', req.params.name);
        board = u;
        done = -3;

        User.findOne({_id: u.createdBy}, function (err, user){
          boardAuthor = user.email;
          done++;
          renderToScreen();
        });

        Event.findOne({board: u._id, type: 'BOARD_CREATE'}, function(err, event){
          createDate = event.createdAt;
          done++;
          renderToScreen();
        });

        Ticket.count({board: u._id}, function(err, count){
          boardTicketCount = count;
          done++;
          renderToScreen();
        });
      });

    function renderToScreen(){
      if(done == 0){
        res.render('index', {board: board, author: boardAuthor, date: createDate, boardTicketCount: boardTicketCount, partial: 'partials/board'});
      }
    }

  });

  /*app.get('/usercount', function(req, res) {

      User.count({}, function(err, count) {

			res.setHeader("Content-type", "application/javascript");
          res.status(200).send('{"count":'+count+',"maxCount":'+stats.userDbmaxLoad+'}');

      });

  });*/

  app.get('/generateusers/:count', function(req, res) {
    var c = (req.params.count === '*' ? 50 : req.params.count);
	populateData(c, "user");
    res.status(200).send("generaatiosivu :: "+c+" käyttäjää<br><br><a href='/'>palaa</a>");
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

    res.status(200).send("generaatiosivu :: "+c+" lautaa<br><br><a href='/'>palaa</a>");
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

    res.status(200).send("generaatiosivu :: "+c+" tikettiä<br><br><a href='/'>palaa</a>");
  });

  app.post('/banuser', function(req, res) {

	var data = req.body,
		email = data.email, b = new Date(data.begin), e = new Date(data.end);

	User.update({"email" : email}, {$set : {"banning.begin" : (b || null), "banning.end" : (e || null)}}, { multi: false }, function (err, aff, raw) {
		if (err) res.status(204).end();

		var uri = '/users?bannedUser='+email;
		res.redirect(uri);
		//res.status(200).send('käyttäjä '+email+' estetty aikavälille '+(b.toISOString() || '?')+' - '+(e.toISOString() || '?'))
	});

  });

  app.post('/recoverpassword', function(req, res) {

		var data = req.body,
			email = data.email,
			pass = omatUtils.generateRandomPassword();//console.log(email, pass);

		User.update({"email":email}, {$set : {"password" : pass}}, {multi:false}, function(err, aff, raw) {

			if (err) {
				console.log(err);
				res.status(204).end();
			}

			//console.log(aff);
			var uri = '/users?recoveredUser='+email;

			mailer.transporter.sendMail({
				from: 'Dont-reply <'+mailer.loginInfo+'>', to: email,
				subject: 'Password recovered', text: 'Hello!\n\nYour new password is: '+pass
			}, function(err, info) {

				if (err) {
					console.log(err);
					res.redirect(uri+'&sent=0');
				}

				res.redirect(uri+'&sent=1');

			});

		});

	});

 app.post('/databases', function(req, res) {

		var dbs = req.body.db, act = req.body.action;

		if (!dbs || dbs.length === 0) res.status(204).end();

		var file = {}, ready = 0, filename, now = new Date();

		function getModel(db) {

			var model = null;

			switch(db) {
				case 'users': model = User; break;
				case 'boards': model = Board; break;
				case 'tickets': model = Ticket; break;
				case 'events': model = Event; break;
			}

			return model;

		}

		function empty(db) {

			var model = getModel(db);

			model.remove({}, function(err, aff) {

				console.log('%d removed from %s', aff, db);

				ready++;
				if (ready === 0) {
					res.redirect('/databases');
				}

			});

		}

		function backup(db) { console.log('pakataan '+db+'...');
			var arr = {}, model = getModel(db);

			model.find({}, function(err, doc) {
				console.log(doc);
				arr['db'] = db;
				arr['rowCount'] = doc.length;
				arr['data'] = JSON.stringify(doc);

				file['dbs'][arr['db']] = arr;

				ready++;
				sendFile();
			});
		}

		function sendFile() {

			if (ready === 0) {
				filename = 'backups.'+now.getDate()+'.'+(now.getMonth()+1)+'.'+now.getFullYear()+'.json';

				file['creator'] = 'admin: '+req.body.creator;
				file['date'] = now.toISOString();
				file['comments'] = req.body.comments;

				res.setHeader("Content-type", "application/javascript; charset=utf-8");
				res.setHeader("Content-Disposition", 'attachment; filename="'+filename+'"');
				res.status(200).send(JSON.stringify(file));
			}

		}

		//
		ready = -1*dbs.length;
		file['dbs'] = {};

		var db;
		switch(act) {
			case 'backup': for(var i in dbs) { backup(dbs[i]); } break;
			case 'empty': for(var i in dbs) { empty(dbs[i]); } break;
		}

});

app.get('/restore',function(req, res) {

     res.render('index', {partial : 'partials/restore'});

});

app.post('/restore', function(req, res, next) {
	//~ console.log(req.body);
    //~ console.log(req.files);

	if (req.files) {
		//~ if (req.files.db.size === 0) {
		            //~ return next(new Error("Hey, first would you select a file?"));
		//~ }

		fs.exists(req.files.db.path, function(exists) {

			if (exists) {
				fs.readFile('./'+req.files.db.path, 'utf8', function(err, data) {

					if (err) done(err);

					var arr = JSON.parse(data), db = JSON.parse(arr['data']);

					switch(arr['db']) {
						case 'user':

							if (req.body.overwrite == '1') {
								User.remove({}, function(err, res) {

									console.log('RESTORE : overwriting is on - emptying the db...');

								});
							}

							User.collection.insert(db, function(err, docs) {

								if (err) return done(err);

								console.log('RESTORE : %d rows inserted into document', docs.length);
								res.status(204).end();//res.status(200).send(docs.length+' käyttäjää lisättiin!');

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

        else if(schema == "board"){
          var d = new Board(omatUtils.generateRandomBoard(Array));
          saveBoardEvent(d, Array);
        }

        else if(schema == "ticket"){
          var d = new Ticket(omatUtils.generateRandomTicket(Array));
          saveTicketEvent(d, Array);
        }

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

function saveTicketEvent(ticket, Array){

  var boardOwner;
  var ticketOwner;

  Board.findOne({_id: ticket.board}, function(err, board){
    boardOwner = board.createdBy;

    User.findOne({_id: boardOwner}, function(err, user){
      ticketOwner = {id: user._id, email: user.email};

      var e = new Event({
                          board: ticket.board,
                          user:{
                            id: ticketOwner.id,
                            type: "user",
                            username: ticketOwner.email},
                          type: 'TICKET_CREATE'
                        });

      e.save(function (err, u){
        if(err) return done(err);
        else console.log("event lisätty");
      });

    });

  });
};

function saveBoardEvent(board, Array){
  var e = new Event({
                      board: board._id,
                      user: {
                        id: board.createdBy,
                        type: "user",
                        username: "testinimi"
                      },
                      type: 'BOARD_CREATE'
                    });

  e.save(function (err, u){
    if(err) return done(err);
    else console.log("event lisätty");
  })

};

function done(err) {

  if (err) console.error(err);

  //User.remove(function () { Board.remove(function () { mongoose.disconnect(); }) });

  //mongoose.disconnect();

};
