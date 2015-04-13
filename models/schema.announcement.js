'use strict';

var mongoose = require('mongoose');

var AnnouncementSchema = new mongoose.Schema({

	board : {
		ref : 'board',
		type : [mongoose.Schema.Types.ObjectId],
		required : true
	},

	visible : {
		begin : { type : Date },
		end : { type : Date }
	},

	level : { /* level is miminum for user level - visitor shows to all, user to power users and admins and admin only to admins */
		type : String,
		enum : ['ADMIN','USER','VISITOR']
	},

	created : { type : Date, required : true, default : Date.now },

	type : {
		type : String,
		enum : ['GENERAL','OFFLINE','OFFLINE_MAINTENANCE','TEATIME'],
		default : 'GENERAL'
	},
	title : { type: String },
	body : { type : String, required : true }

});

if (!AnnouncementSchema.options.toJSON) AnnouncementSchema.options.toJSON = {};
if (!AnnouncementSchema.options.toObject) AnnouncementSchema.options.toObject = {};
AnnouncementSchema.options.toJSON.transform = function(doc, ret) { delete ret._id; delete ret.__v; }
AnnouncementSchema.options.toObject.transform = AnnouncementSchema.options.toJSON.transform;

module.exports = AnnouncementSchema;