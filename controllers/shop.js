const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit'); // Importing PDFKit constructor to generate PDF invoices
const stripe = require('stripe')(process.env.STRIPE_KEY);


const ITEMS_PER_PAGE = 2; // Number of items to display per page for pagination


exports.getProducts = (req, res, next) => {
  let page = parseInt(req.query.page) || 1; // Get the current page from the query parameter or default to 1

  Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .then(products => {
      Product.countDocuments()
        .then(totalProductsCount => {
          const pagesCount = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
          return {
            totalPages: pagesCount,
            currPage: page,
            hasPrev: page > 1,
            hasNext: page < pagesCount
          };
        })
        .then(pagingData => {
          res.render("shop/product-list", {
            prods: products,
            pageTitle: "Products",
            path: '/products',
            pagination: pagingData
          });
        });
    }).catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};

// This function retrieves a single product by its ID
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId; // Extracting the product ID from the request

  Product.findById(prodId) // Using the Product model to find the product by its ID
    .then(product => {
      res.render('shop/product-detail', {
        product: product, // The product is the first element in the array returned
        pageTitle: product.title, // Using the product title for the page title
        path: '/products',
      })
    }).catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};


exports.getIndex = (req, res, next) => {
  let page = parseInt(req.query.page) || 1; // Get the current page from the query parameter or default to 1

  Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
    .then(products => {
      Product.countDocuments()
        .then(totalProductsCount => {
          const pagesCount = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
          return {
            totalPages: pagesCount,
            currPage: page,
            hasPrev: page > 1,
            hasNext: page < pagesCount
          };
        })
        .then(pagingData => {
          res.render("shop/index", {
            prods: products,
            pageTitle: "All Products",
            path: "/",
            pagination: pagingData
          });
        });
    }).catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });

  // let totalProducts;
  // Product.countDocuments() // Count the total number of products in the database
  //   .then(numProducts => {
  //     totalProducts = numProducts; // Store the total number of products

  //     return Product.find()
  //       .skip((page - 1) * ITEMS_PER_PAGE) // Skip the products of previous pages
  //       .limit(ITEMS_PER_PAGE) // Limit the number of products to ITEMS_PER_PAGE  
  //   })
  //   .then(products => {
  //     res.render('shop/index', {
  //       prods: products,
  //       pageTitle: 'Shop',
  //       path: '/',
  //       isAuthenticated: req.session.isLoggedIn,
  //       currentPage: page, // Current page number from the query parameter
  //       totalProducts: totalProducts, // Total number of products for pagination
  //       totalPages: Math.ceil(totalProducts / ITEMS_PER_PAGE),// Total number of pages calculated
  //       hasNextPage : (page * ITEMS_PER_PAGE) < totalProducts, // Check if there is a next page 
  //       hasPreviousPage: page > 1, // Check if there is a previous page
  //       nextPage: page + 1, // Next page number
  //       previousPage: page - 1 ,// Previous page number  //we need to parse because query parameters are strings
  //       lastPage : Math.ceil(totalProducts / ITEMS_PER_PAGE) // Last page number calculated
  //     });
  //   })
};

exports.getCart = (req, res, next) => {

  req.user.populate('cart.items.productId') // Populating the productId field in the cart items
    .then(user => {
      const products = user.cart.items; // Getting the populated cart items
      console.log('cart products', products);
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        isAuthenticated: req.session.isLoggedIn,
        products: products // Pass the products in the cart to the view
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId; // Extracting product ID from the form when we submit add to cart

  Product.findById(productId) // Find the product by its ID
    .then(product => {
      return req.user.addToCart(product) // Using the user instance to get the cart associated with that user
    })
    .then((result) => {
      console.log('add cart result', result);

      res.redirect('/cart'); // Redirecting to the cart page after adding the product
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const productId = req.body.productId; // Extracting product ID from the form when we submit delete from cart

  req.user.removeFromCart(productId) // Using the user instance to delete the product from the cart
    .then(result => {
      res.redirect('/cart'); // Redirecting to the cart page after deleting the product
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};

exports.getOrders = (req, res, next) => {

  Order.find({ 'user.userId': req.user._id }) // Finding orders for the logged-in user
    .then(orders => {
      console.log('orders', orders);
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        isAuthenticated: req.session.isLoggedIn,
        orders: orders // Pass the orders to the view
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};

exports.getCheckoutSuccess = (req, res, next) => {

  req.user.populate('cart.items.productId') // Populating the productId field in the cart items
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } }; // Mapping the cart items to the required format
      });
      const order = new Order({
        products: products,
        user: {
          email: req.user.email,
          userId: req.user._id // Using the user ID from the user instance
        }
      });
      return order.save(); // Creating a new order in the database
    })
    .then(result => {
      return req.user.clearCart(); // Clearing the cart after the order is placed
    })
    .then(result => {
      console.log('add order result', result);
      res.redirect('/orders'); // Redirect to the orders page after creating the order
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};


exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId; // Extracting the order ID from the request parameters

  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No order found')); // If no order is found, pass an error to the next middleware
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized')); // If the order does not belong to the logged-in user, pass an unauthorized error
      }

      const invoiceName = 'invoice-' + orderId + '.pdf'; // Naming the invoice file
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const pdfDoc = new PDFDocument(); // Creating a new PDF document
      res.setHeader('Content-Type', 'application/pdf'); // Setting the content type to PDF
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"'); // Setting the content disposition to inline for browser display

      pdfDoc.pipe(fs.createWriteStream(invoicePath)); // Saving the PDF to the file system
      pdfDoc.pipe(res); // Piping the PDF to the response to send it to the client

      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      });
      pdfDoc.text('-----------------------');

      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
      });

      pdfDoc.text('---');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

      pdfDoc.end(); // we tell node that we are done writing to the PDF document

    })
    .catch(err => {
      console.log(err);
      return next(new Error(err)); // Pass any errors to the next middleware for handling
    });
};

exports.getCheckout = (req, res, next) => {

  let products;
  let total = 0;
  req.user.populate('cart.items.productId') // Populating the productId field in the cart items
    .then(user => {
      products = user.cart.items; // Getting the populated cart items
      let total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });

      return stripe.checkout.sessions.create({ //call this method to create a new checkout session where we define parameters required by stripe
        payment_method_types: ['card'],
        line_items: products.map(p => { //map method transforms each product to an object required by stripe and stores in line_items array
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: p.productId.title,
                description: p.productId.description
              },
              unit_amount: p.productId.price * 100 // Stripe expects the amount in cents
            },
            quantity: p.quantity
          };
        }),
        mode: 'payment',
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success', //adding dynamic host url
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
      });
    })
    .then(session => {
      console.log('cart products', products);
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products, // Pass the products in the cart to the view
        totalSum: total,
        sessionId: session.id // Pass the session ID to the view to later pass to stripe.js
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};
