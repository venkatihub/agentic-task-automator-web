const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  component: String,
  templateName: String,
  html: String,
  css: String,
  js: String,
  dependencies: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Template', TemplateSchema);
