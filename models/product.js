const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const productSchema = new Schema({
  title: {
	type: String,
	required: true
  },
  price: {
	type: Number,
	required: true
  },
  description: {
	type: String,
	required: true
	  },
  imageUrl: {	
	type: String,
	required: true
	  },
  userId: {
	type: Schema.Types.ObjectId,
	ref: 'User',
	required: true
  }
});

module.exports = mongoose.model('Product', productSchema); // Exporting the Product model based on the productSchema
// the model name will be used to create a collection in the database, which will be 'products' in plural form

