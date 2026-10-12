/**
 * Model registry.
 * Always import models from here: the global serialisation plugin must be
 * registered before any schema is compiled.
 */
const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSON.plugin');

mongoose.plugin(toJSONPlugin);

module.exports = {
  User: require('./User'),
  PasswordResetToken: require('./PasswordResetToken'),
  Category: require('./Category'),
  Service: require('./Service'),
  Employee: require('./Employee'),
  Appointment: require('./Appointment'),
  BookedSlot: require('./BookedSlot'),
  Payment: require('./Payment'),
  Review: require('./Review'),
  Notification: require('./Notification'),
  GalleryItem: require('./GalleryItem'),
  Supplier: require('./Supplier'),
  InventoryItem: require('./InventoryItem'),
  StockTransaction: require('./StockTransaction'),
  Setting: require('./Setting'),
  Media: require('./Media'),
  ContactMessage: require('./ContactMessage'),
};
