var mongoose = require('mongoose');

// Watchlist schema
var PortfolioSchema = mongoose.Schema({

	email:{
		type: String,
		required: true,
		unique: true
	},
	order: {
		type: Array
	}
});

var Portfolio = module.exports = mongoose.model('Portfolio', PortfolioSchema);