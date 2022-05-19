var mongoose = require('mongoose');

// Watchlist schema
var WatchlistSchema = mongoose.Schema({

	email:{
		type: String,
		required: true,
		unique: true
	},
	watchlist: {
		type: Array
	},
	amount: {
		type:Number
	}
});

var Watchlist = module.exports = mongoose.model('Watchlist', WatchlistSchema);