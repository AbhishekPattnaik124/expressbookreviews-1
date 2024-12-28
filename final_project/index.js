const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { general } = require('./router/general.js');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
const PORT = 5000;

app.use(express.json());

// Use the general routes for books
app.use('/books', general);

// Use the customer authentication routes
app.use("/customer/auth", customer_routes);

// General routes for various endpoints
app.use("/promise/books", general);
app.use('/async/books', general);
app.use('/async/isbn', general);
app.use('/promise/isbn', general);
app.use('/async/author', general);
app.use('/async/title', general);

// Session handling middleware for customer routes
app.use("/customer", session({ secret: "secretKey", resave: true, saveUninitialized: true }));

// Authentication middleware for customer routes
app.use("/customer/auth/*", function auth(req, res, next) {
  // Check if the user has an access token in the session
  if (!req.session.accessToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify the access token and extract the user password from it
  const accessToken = req.session.accessToken;
  try {
    const decodedToken = jwt.verify(accessToken, "secretKey");
    const userPassword = decodedToken.userPassword;
    req.userPassword = userPassword;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid access token", error: err });
  }
});

// Use the customer routes
app.use("/customer", customer_routes);

// Use the general routes for all other endpoints
app.use("/", genl_routes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
