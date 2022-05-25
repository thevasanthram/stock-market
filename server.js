const axios = require("axios").default;
const express = require("express")
const path = require('path')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser');
const User = require('./model/user');
const Watchlist = require('./model/watchlist');
const user = require("./model/user");
const Portfolio = require("./model/portfolio");
const TradeHistory = require('./model/tradehistory');
const { parse } = require("path");

const options = {
  method: 'GET',
  url: 'https://latest-stock-price.p.rapidapi.com/price',
  params: {Indices: 'NIFTY 50'},
  headers: {
    'X-RapidAPI-Host': 'latest-stock-price.p.rapidapi.com',
    'X-RapidAPI-Key': 'c621674940msh87d87962e4dbb81p14d3bfjsnc0ae1ebea4e2'
  }
};


mongoose.connect('mongodb+srv://admin:admin@stockmarket.5forh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority' , { useNewUrlParser: true} ,(err) => {
    if(err){
        console.log(err)
    }
    else{
        console.log("Database connection succesfull")
    }
})

const app = express()

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}))
app.set("view engine", "ejs");

app.get('/', (req, res) => {
    res.render(path.join(__dirname, "/public/index.ejs"))
})

app.get('/login', (req, res) => {
  if(req.cookies.logged){
  	res.redirect('/home');
  } else {
  	res.render(path.join(__dirname,'/public/login.ejs') , {flag : false});
  }
})

app.post('/login', (req, res) => {
    var email = req.body.email;
    var pass = req.body.password;
    var query = User.findOne({ 'email': email, 'password':pass });
    query.exec( (err, user) => {
    if(user){
        console.log('Email: %s, Password: %s', user.email, user.password);
        res.cookie('logged',user.email);
        res.cookie('username',user.name);
        res.redirect('/home');
    }else
    {
        res.render(path.join(__dirname, '/public/login.ejs') , {flag : true});
    }
})
})


app.get('/register', (req, res) => {
    if(req.cookies.logged){
  	res.redirect('/home');
  } else {
  	res.render(path.join(__dirname, "/public/register.ejs"));
  }
})

app.post('/register', (req, res) => {
    var user = new User({
  	name: req.body.name,
  	password: req.body.password,
  	email: req.body.email
  });

  user.save();
  res.redirect('/login')
})

app.get('/home', (req, res) =>{
    console.log(req.cookies.username)
    res.render(path.join(__dirname, 'public/home.ejs') , {username: req.cookies.username})
})
app.get('/data',(req, res)=>{
    axios.request(options).then(function (response) {
        res.render(path.join(__dirname, "/public/data.ejs") , {dataFromResponse: response.data} )
    }).catch(function (error) {
        console.error(error);
    });
    
})

app.post('/data', (req, res) => {
    var itemSelectedFromDropdown = req.body.stockSelected;
    axios.request(options).then(function (response) {

        var dataFromResponse = response.data;
  
        for(var i = 0; i<dataFromResponse.length; i++){  
          if(dataFromResponse[i].symbol == itemSelectedFromDropdown){
                var dataOfStock = dataFromResponse[i];

                res.send("<html><head><title>Stock Detail</title></head>"+
                        "<body> <h1><strong> " + dataOfStock.symbol + "</strong></h1>"+
                        "<blockquote>"+
                        "<h2> Open: " + dataOfStock.open + "</h2>" +
                        "<h2> Day High: "+ dataOfStock.dayHigh + "</h2>" +
                        "<h2> Day Low: "+ dataOfStock.dayLow + "</h2>" +
                        "<h2> Last Price: "+ dataOfStock.lastPrice + "</h1>" +
                        "<h2> Previous Close: "+ dataOfStock.previousClose + "</h2>" +
                        "<h2> Year Low: "+ dataOfStock.yearHigh + "</h2>" +
                        "<h2> Year Low: "+ dataOfStock.yearLow + "</h2>" +
                        "<h2> Last Update Time: "+ dataOfStock.lastUpdateTime + "</h2>" +
                        "</blockquote>"+
  
                        "</body></html>")
        }
        }
          
}).catch(function (error) {
console.error(error);
});
});

app.get('/alldata', (req, res) => {
    axios.request(options).then(function (response) {
  
        res.render(path.join(__dirname, "/public/alldata.ejs") , {dataFromResponse: response.data} )
          
}).catch(function (error) {
console.error(error);
});
})

app.get('/mywatchlist', (req, res)=>{
    axios.request(options).then(function (response) {
    var query = Watchlist.findOne({ 'email' : req.cookies.logged });
    query.exec( function(err , userWatchlist) {
        if(err) res.send('error in retrieving: no document found')
        else{
            if (userWatchlist == null){
                res.render(path.join(__dirname , '/public/watchlist.ejs') , { Watchlist : 0})
            }
            else{
                // console.log(userWatchlist.watchlist)
                res.render(path.join(__dirname , '/public/watchlist.ejs') , { dataFromResponse: response.data , Watchlist : userWatchlist.watchlist})
            }
        }
    })   
})
})

app.get('/addstock' , (req, res) => {

    axios.request(options).then(function (response) {
        var dataFromResponse = response.data;
        // console.log(dataFromResponse)
        var query = Watchlist.findOne({ 'email' : req.cookies.logged });
        query.exec( function(err , userWatchlist) {
            if(err) res.send('error in retrieving: no document found')
            else{
                if (userWatchlist == null){
                    res.render(path.join(__dirname , '/public/addstock.ejs') , {dataFromResponse: dataFromResponse})
                }
                else{
                    for ( var i = 0 ; i < userWatchlist.watchlist.length; i++){
                        for (var j = 0; j < dataFromResponse.length; j++){
                            if (userWatchlist.watchlist[i] == dataFromResponse[j].symbol){
                                dataFromResponse.splice(j,1)
                            }
                        }
                    }
                    // console.log(dataFromResponse)
                    res.render(path.join(__dirname , '/public/addstock.ejs') , {dataFromResponse: dataFromResponse})
                }
            }
        })        
}).catch(function (error) {
console.error(error);
}); 
})

app.post('/addstock' , (req, res) => {
    // console.log(req.body.stockSelected)
    var query = Watchlist.findOne({ 'email' : req.cookies.logged });
    query.exec( function(err , userWatchlist) {
        if(err){ res.send('error in retrieving: no document found')}
        else{
            if(userWatchlist == null){
                var watchlist = new Watchlist({
                    email : req.cookies.logged,
                    watchlist : [req.body.stockSelected],
                    amount : 500000
                })
                watchlist.save();
                res.redirect('/mywatchlist')
            }
            else{
                var tempArray = []
                tempArray = userWatchlist.watchlist
                tempArray.push(req.body.stockSelected)
                userWatchlist = {
                    email : req.cookies.logged,
                    watchlist : tempArray
                }
                Watchlist.updateOne(
                    {'email': req.cookies.logged},
                    { $set : { 'watchlist' : tempArray }}
                ).then(console.log('watch list successfully added')).catch((err)=>  console.log(err))

                res.redirect('/mywatchlist')
            }
        }
    })
})

app.get('/deletestock' , (req , res) => {
    var query = Watchlist.findOne({ 'email' : req.cookies.logged });
    query.exec( function(err , userWatchlist) {
        if(err){ res.send('error in retrieving: no document found')}
        else
        {
            if (userWatchlist == null){
                res.render(path.join(__dirname , '/public/deletestock.ejs') , {userWatchlist: 0})
            }else{
                res.render(path.join(__dirname , '/public/deletestock.ejs') , {userWatchlist: userWatchlist.watchlist})
            }
        }

        
})
})

app.post('/deletestock' , (req , res) => {
    var query = Watchlist.findOne({ 'email' : req.cookies.logged });
    query.exec( function(err , userWatchlist) {
        if(err){ res.send('error in retrieving: no document found')}
        else
        {
            watchlistHolder = userWatchlist.watchlist
            var position = watchlistHolder.indexOf(req.body.stockSelected)
            watchlistHolder.splice(position , 1)
            Watchlist.updateOne(
                {"email": req.cookies.logged} , 
                { $set : {'watchlist': watchlistHolder}}
            ).then(console.log('Stock deleted successfully')).catch((err) => console.log(err))

            res.redirect('/mywatchlist')
        }
    })
})


app.post('/transaction' , (req, res) => {
    const query = Watchlist.findOne({'email': req.cookies.logged})
    query.exec((err , userdata)=> {
        if(err) console.log(err)
        else{
            res.render(path.join(__dirname, '/public/transaction.ejs') , {symbol: req.body.symbol , lastPrice: req.body.price , amount: userdata.amount , flag: false})
        }
    })
})

app.get('/portfolio' , (req,res) => {

    axios.request(options).then(function (response) {
        var dataFromResponse = response.data
        var query = Portfolio.findOne({ 'email' : req.cookies.logged });
        query.exec( function(err , userdata) {
            if(userdata == null){
                res.render(path.join(__dirname, 'public/portfolio.ejs') , {totalPL: 0 ,positions: 0 , individualPL: 0 })
            }else{
                var userOrders = userdata.order
                var currentPrice = []
                for ( var i = 0; i < userOrders.length ; i++){
                    for (var j = 0; j < dataFromResponse.length; j++){
                        if(userOrders[i].symbol == dataFromResponse[j].symbol){
                            currentPrice.push(parseInt(dataFromResponse[j].lastPrice))
                        }
                    }
                }
                // console.log(currentPrice)
                var individualPL = []
                for(var i = 0; i < userOrders.length; i++){
                    individualPL.push( parseInt(userdata.order[i].quantity) * (currentPrice[i] - parseInt(userdata.order[i].price)))
                }
                var totalPL = 0
                for(var i = 0; i < individualPL.length; i++){
                    totalPL += individualPL[i]
                }
                // console.log(totalPL)
                res.render(path.join(__dirname, 'public/portfolio.ejs') , {totalPL: totalPL ,positions: userdata.order ,currentPrice: currentPrice , individualPL: individualPL })
            }
        })   
})
})

app.post('/portfolio' , (req, res)=> {
    // console.log(req.body.mode)
    // console.log(req.body.quantity)
    // console.log(req.body.symbol)
    // console.log(req.body.price)
    // console.log(req.body.amount)

    if((req.body.quantity * req.body.price) <= req.body.amount){
        var total = req.body.quantity * req.body.price
        var newAmount = req.body.amount - total
        Watchlist.updateOne({'email': req.cookies.logged}, {$set: { amount: newAmount}}).catch((err) => console.log(err))
        var tempObject = {
            symbol: req.body.symbol,
            price: req.body.price,
            quantity: req.body.quantity,
            amount: req.body.amount,
            mode: req.body.mode
        }
        var query = Portfolio.findOne({'email': req.cookies.logged})
        query.exec( function(err , userdata) {
            if(err){ res.send('error in retrieving: no document found')}
            else{
                if(userdata == null){
                    // console.log('userdata null')
                    var tempArray = []
                    tempArray.push(tempObject)
                    var portfolio = new Portfolio({
                        email: req.cookies.logged,
                        order: tempArray
                    })

                    portfolio.save()
                    res.redirect('/portfolio')
                }else{
                    // console.log('userdata not null')
                    var updatedOrder = userdata.order
                    updatedOrder.push(tempObject)
                    Portfolio.updateOne(
                        {'email': req.cookies.logged},
                        {$set: {'order': updatedOrder}}
                    ).then(console.log('order successfully added to the list')).catch((err)=> console.log(err))
                    res.redirect('/portfolio')
                }
            }
        })
        
    }else{
        res.render(path.join(__dirname , '/public/transaction.ejs') , {symbol: req.body.symbol , lastPrice: req.body.price , amount: req.body.amount, flag: true})
    }

    // res.send("WEB PAGE UNDER DEVELOPMENT")
})

app.get('/tradehistory' , (req , res) => {
    const query = TradeHistory.findOne({'email': req.cookies.logged})
    query.exec((err, userdata) => {
        if (err) console.log(err)
        else{
            if(userdata == null)
            {
                res.render(path.join(__dirname , '/public/tradehistory.ejs') , {totalPL: 0, tradehistory: 0} )
            }else{
                var totalPL = 0
                var tempArray = userdata.tradehistory
                for (var i = 0; i < tempArray.length; i++){
                    totalPL += parseInt(tempArray[i].PL)
                }
                res.render(path.join(__dirname , '/public/tradehistory.ejs') , {totalPL: totalPL, tradehistory: userdata.tradehistory} )
            }
        }
    })

})

app.post('/tradehistory' , (req, res) => {
    // console.log(req.body.symbol)
    // console.log(req.body.mode)
    // console.log(req.body.individualPL)
    // console.log(req.body.quantity)
    // console.log(req.body.price)
    

    var tempArray = []

    const query0 = Watchlist.findOne({'email': req.cookies.logged})
    query0.exec((err, userdata) => {
        if (err)console.log(err)
        else
        {
            if(req.body.individualPL >= 0){
                var newAmount = parseInt(userdata.amount) + parseInt(req.body.individualPL) + parseInt(req.body.quantity * req.body.price)
            }else{ 
                var newAmount = parseInt(userdata.amount) - parseInt(req.body.individualPL) + parseInt(req.body.quantity * req.body.price)
            }
            Watchlist.updateOne({'email': req.cookies.logged} , {$set: {amount: newAmount}}).then(console.log('amount updated'))
        }
    })
    
    const query = TradeHistory.findOne({'email': req.cookies.logged})
    query.exec( function(err , userdata){
        if(err) console.log(err)
        else{
            if(userdata == null){
                // console.log('entering if block')
                tempArray.push({ symbol: req.body.symbol , PL: req.body.individualPL})
                var trade = new TradeHistory({
                    email: req.cookies.logged,
                    tradehistory: tempArray
                })
                trade.save()
            }else{
                // console.log('entering else block')
                tempArray = userdata.tradehistory
                // console.log(tempArray)
                tempArray.push({ symbol: req.body.symbol , PL: req.body.individualPL})
                // console.log(tempArray)
                TradeHistory.updateOne({'email': req.cookies.logged} , {$set: {tradehistory: tempArray}}).then(console.log('Trade History updated'))
            }
        }
    })

    const query1 = Portfolio.findOne({'email': req.cookies.logged})
    query1.exec( (err , userdata) => {
        if(err) console.log(err)
        else{
            var tempArray1 = userdata.order
            // console.log(tempArray1)
            var index = 0
            for(var i = 0; i < tempArray1.length; i++){
                if(tempArray1[i].symbol == req.body.symbol){
                    index = i
                    break
                }
            }
            // console.log(index)
            tempArray1.splice(index,1)
            // console.log(tempArray1)
            Portfolio.updateOne({'email': req.cookies.logged} , {$set: {'order': tempArray1}}).then(console.log('portfolio updated'))
        }
    })

    res.redirect('/tradehistory')
})

app.get('/logout' , (req, res)=>{
    res.clearCookie("logged")
    res.redirect('/login')
})

app.listen(80, ()=>{
    console.log("server listening on the port 80")
});
