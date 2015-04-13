var mongoose = require('mongoose');
var BoardSchema = require('../models/schema.board'), Board = mongoose.model('Board', BoardSchema),
	UserSchema = require('../models/schema.user'), User = mongoose.model('User', UserSchema),
	TicketSchema = require('../models/schema.ticket'), Ticket = mongoose.model('Ticket', TicketSchema),
	EventSchema = require('../models/schema.event'), Event = mongoose.model('Event', EventSchema);

module.exports = {

  sidepanelStatistics: function(req, res, next) {
    /*
      Palauttaa lautojen, käyttäjien, (tikettien ja vieraiden) määrät, jotka näkyvät
      adminpaneelin vasemmassa alakulmassa.
    */

	//res.locals.guestCount = "sinä";

    User.count({}, function(err, count) {
      res.locals.userCount = count;

      Board.count({}, function(err, count) {
        res.locals.boardCount = count;

        Ticket.count({}, function(err, count) {
          res.locals.ticketCount = count;

          Event.count({createdAt: {$gt: ((new Date) - 1000*60*60)}, type: "BOARD_GUEST_JOIN"}, function (err, count) {
		    res.locals.guestCount = count;

            next();
		  });

        });

      });

    });

  },

  getEventsByPerson: function(req, res, next) {
    /*
      palauttaa eventtien määrän 60 min aikana alenevassa järjestyksessä.
    */

    var lastHour = new Date();
    lastHour.setHours(lastHour.getHours()-1);

    Event.aggregate([
      {$match:
        {
          _id: {$ne: null},
          createdAt: {$gt: lastHour}
        }
      },
      {$group:
        {
          _id: "$user.id",
          count: {$sum:1}
        }
      },
      {$sort:
        {
          count: -1
        }
      },
      {$limit: 10}
    ],
      function (err, result){
        if(err){
          next("eventtejä ei löytynyt", result);
          //return result;
        }
        next(false, result);
      }
    );
  },

  getEventsByBoard: function(req, res, next) {
    /*
      palauttaa eventtien määrän 60 min aikana alenevassa järjestyksessä.
    */

    var lastHour = new Date();
    lastHour.setHours(lastHour.getHours()-1);

    Event.aggregate([
      {$match:
        {
          _id: {$ne: null},
          createdAt: {$gt: lastHour}
        }
      },
      {$group:
        {
          _id: "$board",
          count: {$sum:1}
        }
      },
      {$sort:
        {
          count: -1
        }
      },
      {$limit: 10}
    ],
      function (err, result){
        if(err){
          next("eventtejä ei löytynyt", result);
          return;
        }
        next(false, result);
      }
    );
  }

};
