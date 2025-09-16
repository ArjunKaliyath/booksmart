# Booksmart

Booksmart is an e-commerce application for a bookstore specializing in classic literature and new-release fantasy novels. The project is built with Node.js and Express, with a focus on a full-stack architecture that includes user authentication, product management, a shopping cart, and a secure checkout process. It also features an integrated AI chatbot and PDF invoice generation.

## Features

* **User Authentication**: Secure user registration, login, and password reset functionality using `bcryptjs` for password hashing.
* **Product Management**: An admin panel that allows authenticated users to add, edit, and delete products, including image uploads handled by `multer`.
* **Shopping Cart & Orders**: Users can add products to a persistent shopping cart. The application manages order creation after a successful checkout.
* **Payment Processing**: Integrated with the **Stripe** API for secure and seamless payment processing.
* **AI Chatbot**: An interactive chatbot is integrated using the **Google Generative AI** API to assist users with their queries.
* **PDF Invoice Generation**: Order invoices are dynamically generated as PDF files using the `pdfkit` library.
* **Security**: The application includes protection against CSRF attacks using the `csrf-sync` middleware and sets security-related HTTP headers with the `helmet` package.
* **Database**: Utilizes **MongoDB** for data storage, with `mongoose` as the Object Data Modeling (ODM) library. User sessions are also stored persistently in MongoDB using `connect-mongodb-session`.

## Installation and Setup

To get a local copy of the project up and running, follow these simple steps.

### Prerequisites

* Node.js (version 16 or higher)
* npm (or yarn)
* A MongoDB database (local or cloud-based)
* A Stripe account
* A Google Generative AI API key

### Steps

1.  **Clone the repository**
    ```bash
    git clone [your-repository-url]
    cd booksmart
    ```

2.  **Install NPM packages**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env` file in the root directory and add the following variables.

    ```
    MONGO_USER=<your-mongodb-username>
    MONGO_PASSWORD=<your-mongodb-password>
    MONGO_DB=<your-database-name>
    GOOGLE_API_KEY=<your-google-generative-ai-key>
    STRIPE_KEY=<your-stripe-secret-key>
    ```

4.  **Start the server**
    ```bash
    npm start
    ```
    The application will now be running at `http://localhost:3000`.

## Scripts

* `npm start`: Starts the application with `node`.
* `npm run start-dev`: Starts the application with `nodemon` for development purposes, which automatically restarts the server on file changes.

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.
