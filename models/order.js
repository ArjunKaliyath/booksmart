const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = new Schema({
  products: [
    {
        product: {
            type: Object,  // Storing product details as an object
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }
  ],
    user: {
        email: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }
});

module.exports = mongoose.model('Order', orderSchema); // Exporting the Order model based on the orderSchema
// The model name will be used to create a collection in the database, which will be 'orders' in plural form
// This model will be used to handle orders in the application, storing product details and user information

