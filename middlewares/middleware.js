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

	res.locals.guestCount = "sinä";

    User.count({}, function(err, count) {
      res.locals.userCount = count;

      Board.count({}, function(err, count) {
        res.locals.boardCount = count;

        Ticket.count({}, function(err, count) {
          res.locals.ticketCount = count;
          next();
        });

      });

    });

  },

  getUsers: function(req, res, next) {
    /*
      Palauttaa kaikki käyttäjät ja niiden id:n sekä emailin
    */

    User.aggregate([
    {
      $group: {
        _id: "$email"
      }
    }
    ], function (err, result){
        if(err){
          console.log(err);
          return;
        }
//        console.log(result)
//        return result;
//        res.locals.userList = result;
//        res.send("moro :D");
        next(false, result);
      }
    );
  },

  getUserByID: function(req, res, ID, next){
    /*
      Palauttaa käyttäjän IDn.
    */


  }

};