const path = require('path');

const express = require('express');
const isAuth = require('../middleware/is-auth');

const shopController = require('../controllers/shop');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct); //whenever we have dynamic segment like this using bind variables, we need to keep it at the end after static segments

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart); 

router.post('/cart/remove', isAuth, shopController.postCartDeleteProduct);

router.get('/orders', isAuth, shopController.getOrders);

// router.post('/create-order',isAuth, shopController.postOrders); // IGNORE - replaced with GET request to /checkout/success

router.get('/orders/:orderId', isAuth, shopController.getInvoice); //dynamic route for getting invoice of specific order by orderId

router.get('/checkout', isAuth, shopController.getCheckout);

router.get('/checkout/success', isAuth, shopController.getCheckoutSuccess); // redirect user to orders page if payment is successful

router.get('/checkout/cancel', isAuth, shopController.getCheckout); // redirect user to checkout page if they cancel payment

module.exports = router;
