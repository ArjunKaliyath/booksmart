const { where } = require('sequelize');
const Product = require('../models/product');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    isAuthenticated: req.session.isLoggedIn,
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true,
    editing: false,// This is false because we are adding a new product, not editing an existing one
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const userId = req.user._id; // Get the user ID from the request object
  const errors = validationResult(req); // Validate the request body using express-validator
  console.log('image file ', image);

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      isAuthenticated: req.session.isLoggedIn,
      product: {
        title: title,
        price: price,
        description: description
      },
      editing: false,
      hasError: true,
      errorMessage: 'Attached file is not an image.', // If no image is uploaded, return an error message
      validationErrors: []
    });
  }

  const imageUrl = image.path.replace(/\\/g, '/'); // we store the path with a leading slash to make it relative to the public directory
  console.log('errors ', errors.array());
  //if errors are there, we rerender the edit product page with error message and all the product data that was entered by the user. 
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      isAuthenticated: req.session.isLoggedIn,
      product: {
        title: title,
        price: price,
        description: description
      },
      editing: false,
      hasError: true,
      errorMessage: errors.array()[0].msg, // Get the first validation error message
      validationErrors: errors.array() // Pass all validation errors to the view
    });
  }


  const product = new Product({  // keys are the same as the model schema
    title: title,
    price: price,
    imageUrl: imageUrl,
    description: description,
    userId: req.user._id
  })

  product.save() // the save method we use here is from the mongoose model, which handles the database operations for us
    .then(result => {
      console.log('Created Product');
      res.redirect('/admin/products'); // Redirecting to the admin products page after adding
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit; // Check if the edit mode is enabled
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId; // Get the product ID from the URL


  Product.findById(prodId) // Find the product by its ID
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        path: '/admin/edit-product',
        pageTitle: 'Edit Product',
        editing: editMode,
        product: product,
        isAuthenticated: req.session.isLoggedIn, // Pass the authentication status to the view});
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      })
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};


exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId; // Get the product ID from the form
  const updatedTitle = req.body.title;
  // const updatedImageUrl = req.body.imageUrl;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  const image = req.file;

  const errors = validationResult(req); // Validate the request body using express-validator

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      isAuthenticated: req.session.isLoggedIn,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
        _id: prodId // Include the product ID for the form to submit correctly
      },
      editing: true,
      hasError: true,
      errorMessage: errors.array()[0].msg, // Get the first validation error message
      validationErrors: errors.array() // Pass all validation errors to the view
    });
  }

  Product.findById(prodId) // Find the product by its primary key (ID)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/'); // If the user is not authorized to edit this product, redirect to home
      }

      product.title = updatedTitle;
      if (image) {
        fileHelper.deleteFile(product.imageUrl); // Delete the old image file if a new one is uploaded in an async manner where we don't wait for the deletion to complete
        product.imageUrl = '/' + image.path.replace(/\\/g, '/'); // Update the image URL with the new uploaded image path
      }

      product.price = updatedPrice;
      product.description = updatedDescription;

      return product.save().then(result => {
        console.log('Updated Product');
        res.redirect('/admin/products'); // Redirect to the admin products page after updating
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};


exports.getProducts = (req, res, next) => {

  Product.find({ userId: req.user._id }) // Fetch all products from the database which were created by the logged-in user
    .then(products => {
      res.render('admin/products', {
        prods: products, // Pass the products to the view
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); // Pass the error to the next middleware for handling
    });
};



exports.deleteProduct = (req, res, next) => { 
  const prodId = req.body.productId; // Get the product ID from the form

  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageUrl);

      return Product.deleteOne({ _id: prodId, userId: req.user._id }); // Delete the product by its ID and by ensuring it belongs to the logged-in user
    })
    .then(result => {
      console.log('Deleted Product');
      res.status(200).json({ success: true,  message: 'Success!' }); // Send a success response back to the client
    })
    .catch(err => {
      console.log(err);
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error); // Pass the error to the next middleware for handling
      res.status(500).json({ success: false , message: 'Deleting product failed.' });  //  we send this response if product deletion fails which is handled by the fetch API in the admin.js file
    });
};
