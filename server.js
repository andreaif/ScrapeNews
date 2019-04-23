// Dependencies
var express = require("express");
var cheerio = require("cheerio");
var axios = require("axios");
var exphbs = require('express-handlebars');
var mongoose = require('mongoose');
var logger = require("morgan");

// Require all models
var db = require("./models");

// Initialize Express
var app = express();

// logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Initialize Handlebars
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

//DB Config
const database = require('./config/keys').mongoURI;

//Connect to MongoDB
mongoose
  .connect(database, { useNewUrlParser: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Route for getting all Articles
app.get("/articles-json", function (req, res) {

  db.Article.find()
    .then(function (dbArticle) {
      res.json(dbArticle)
    })
    .catch(function (err) {
      res.json(err)
    })
});

// Route for getting all unsaved 
app.get("/articles", function (req, res) {

  db.Article.find({ saved: false }).sort({ "_id": -1 }).limit(100)
    .then(articles => {
      res.render("index", { article: articles })
    })
    .catch(function (err) {
      // If an error occurs, log the error message
      console.log(err.message);
    });
});

// Route for scraping articles and then calling index page to display all unsaved articles
app.get("/scrape", function (req, res) {

  axios.get("http://www.npr.org/sections/news/archive")
    .then(function (response) {
      var $ = cheerio.load(response.data);
      $(".item-info").each(function (i, element) {

        var data = {
          title: $(element).children('h2').text(),
          link: $(element).children('h2').children('a').attr("href"),
          summary: $(element).children('p').text(),
        };

        // Save these results in mongo
        if (data.title && data.link) {
          //only be created if the article doesn't already exist
          db.Article.updateOne({ title: data.title }, { $set: data, $setOnInsert: { saved: false } }, { upsert: true })
            .then(function (dbArticle) {
              // If saved successfully, then print the new Article document to the console
              console.log("Articles sraped");
            })
            .catch(function (err) {
              // If an error occurs, log the error message
              console.log(err.message);
            });

        }

      });


    })
    .then(function () {
      // gets all unsaved articles from database and sends them to handlebars page
      db.Article.find({ saved: false })
        .then(articles => {
          res.render("index", { article: articles })
        })
        .catch(function (err) {
          // If an error occurs, log the error message
          console.log(err.message);
        });

    })

})

//clear articles
app.get('/clearAll', function (req, res) {
  // using deleteMany because remove was depricated
  db.Article.deleteMany({}, function (err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log('Articles removed');
    }

  });
  res.render("index")
});


// Route for saving the article
app.post("/saved/:id", function (req, res) {

  db.Article.updateOne({ _id: req.params.id }, { $set: { saved: true } }, function (err, doc) {
    if (err) {
      res.send(err);
    }
    else {
      console.log("Article is saved")
      res.redirect("/articles")
    }
  });
});

// Route for removing saved articles
app.post("/remove/:id", function (req, res) {

  db.Article.updateOne({ _id: req.params.id }, { $set: { saved: false } }, function (err, doc) {
    if (err) {
      res.send(err);
    }
    else {
      console.log("Article is no longer saved")
      res.redirect("/saved")
    }
  });
});

// Gets saved articles and calls saved handlebars page
app.get('/saved', function (req, res) {

  db.Article.find({ saved: true }).sort({ "_id": -1 })
    .then(articles => {
      res.render("saved", { article: articles })
    })
    .catch(function (err) {
      // If an error occurs, log the error message
      console.log(err.message);
    });
});


// HTML Route for home page
app.get('/', function (req, res) {
  res.redirect("/articles")
});

// Setup port
var PORT = process.env.PORT || 3000
app.listen(PORT, function () {
  console.log("App running on port " + PORT);
});

