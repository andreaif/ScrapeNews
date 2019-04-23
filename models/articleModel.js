// Require mongoose
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ArticleSchema = new Schema({

  title: {
    type: String,
    trim: true,
    required: "Title is Required"
  },
  summary: {
    type: String,
    trim: true,
  },
  link: {
    type: String,
    trim: true,
    required: "Link is Required"
  },
  saved: {
    type: Boolean,
    default: false
  },

  createdDate: {
    type: Date,
    default: Date.now
  },

});


var Article = mongoose.model("Article", ArticleSchema);
module.exports = Article;
