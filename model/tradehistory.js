var mongoose = require('mongoose');

// Watchlist schema
var TradeHistorySchema = mongoose.Schema({

	email:{
		type: String,
		required: true,
		unique: true
	},
	tradehistory: {
		type: Array
	}
});

var TradeHistory = module.exports = mongoose.model('TradeHistory', TradeHistorySchema);