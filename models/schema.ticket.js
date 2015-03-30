'use strict';

var mongoose = require('mongoose');

/**
 * Schema defining the 'ticket' model.
 */
var TicketSchema = module.exports = new mongoose.Schema({

	/**
	 * Describes on which board does this ticket belong.
	 *
	 * TODO Should we actually group the ticket's under the 'board' model as
	 *      references, or keep this style?
	 */
	board: {
		ref:      'board',
		type:     mongoose.Schema.Types.ObjectId,
		required: true
	},

	/**
	 * The ticket heading.
	 */
	heading: {
		type:     String,
		required: true
	},

	/**
	 * The ticket contents.
	 *
	 * TODO Should we allow HTML content?
	 */
	content: {
		type:    String,
		default: ''
	},

	/**
	 * The ticket color.
	 *
	 * TODO Enumerate the color, eg. #FFF, #BABABA...
	 */
	color: {
		type:    String,
		default: '#FFF'
	},

	/**
	 * The ticket's position. The ticket moves in a 2D-plane (x, y) with z
	 * indicating the 'z-index' of the ticket.
	 *
	 * TODO Clamp these to the board's size? We would need to know the ticket's
	 *      pixel size in order to clamp the x, y -coordinates to the board's
	 *      maximum size.
	 */
	position: {
		x: {
			type:    Number,
			default: 0
		},
		y: {
			type:    Number,
			default: 0
		},
		z: {
			type:    Number,
			default: 0
		}
	}
});

if(!TicketSchema.options.toJSON) TicketSchema.options.toJSON     = { }
if(!TicketSchema.options.toObject) TicketSchema.options.toObject = { }

TicketSchema.options.toJSON.transform = function(doc, ret) {
	ret.id = doc.id;

	delete ret._id;
	delete ret.__v;
}

/**
 * BUG See 'config/schemas/board.js' for details.
 */
TicketSchema.options.toObject.transform = TicketSchema.options.toJSON.transform;

module.exports = TicketSchema;