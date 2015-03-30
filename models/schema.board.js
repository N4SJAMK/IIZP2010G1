'use strict';

var mongoose = require('mongoose');

var BoardSchema = new mongoose.Schema({

	name: { type: String, required: true },
	description: { type: String, default: '' },
	size: { width: { type: Number, default: 8 }, height: { type: Number, default: 8 }},
	background: { type: String, default: 'none' },
	createdBy: { ref: 'user', type: mongoose.Schema.Types.ObjectId, required: true },
	accessCode: { type: String, default: null }

});

module.exports = BoardSchema;