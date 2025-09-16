const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	  email: {
		type: String,
		required: true
	},
	  password: {
		type: String,
		required: true
	},
	  resetToken: String, // Field to store the reset token
	  resetTokenExpiration: Date, // Field to store the expiration time of the reset token
	  cart: {
		items: [
			{
				productId: {
					type: Schema.Types.ObjectId,
					ref: 'Product',
					required: true
				},
				quantity: {
					type: Number,
					required: true
				}
			}
		]
	  }	
});

userSchema.methods.addToCart = function (product) { //we used regular function here because we want to use 'this' keyword to refer to the user instance
	//because in arrow functions, 'this' does not refer to the instance of the class and instead refers to the global object
    const cartProductIndex = this.cart.items.findIndex((cp) => {
        return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity,
        });
    }
    const updatedCart = {
        items: updatedCartItems,
    };
    this.cart = updatedCart;
    return this.save();
};

userSchema.methods.removeFromCart = function(productId) {
	const updatedCartItems = this.cart.items.filter(item => {
		return item.productId.toString() !== productId.toString();
	});
	this.cart.items = updatedCartItems;
	return this.save();
};

userSchema.methods.clearCart = function() {
	this.cart = { items: [] }; // Resetting the cart to an empty array
	return this.save();
};

module.exports = mongoose.model('User', userSchema); // Exporting the User model based on the userSchema


