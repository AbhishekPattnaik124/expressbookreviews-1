const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [
  { id: 1, username: 'Amira', password: 'password1' },
  { id: 2, username: 'bob', password: 'password2' },
  { id: 3, username: 'charlie', password: 'password3' },
  { id: 4, username: 'david', password: 'password4' },
  { id: 5, username: 'emily', password: 'password5' },
  { id: 6, username: 'frank', password: 'password6' },
  { id: 7, username: 'grace', password: 'password7' },
  { id: 8, username: 'hank', password: 'password8' },
  { id: 9, username: 'isabelle', password: 'password9' },
  { id: 10, username: 'jason', password: 'password10' }
];

const isValid = (username, password)=>{ 
  return users.find(user => user.username === username && user.password === password);

}



const authenticatedUser = (username,password)=>{
   // check if the username exists in our records
   let usersList = Object.values(users);
   let user = usersList.find(b => b.username==username)
  if (user) {
    // check if the provided password matches the password in our records
    if (users.password === password) {
      // username and password match, return true
      return true;
    }
  }
  // username and/or password do not match, return false
  return false;
}
//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body;

  // Check if username or password is missing
  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide a valid username and password' });
  }
  const user = users.find(u => u.username === username && u.password === password);

  // Check if username and password match
  if (username === user.username && password === user.password) {
    const accessToken = jwt.sign({ username, userPassword: password }, "secretKey", { expiresIn: '1h' });

    // Store the access token in the session
    req.session.accessToken = accessToken;

    return res.status(200).json({ message: 'Login successful',accessToken });
  } else {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
});
regd_users.get("/auth/review/", (req,res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Access token exists, verify it
  try {
    const decodedToken = jwt.verify(req.session.accessToken, "secretKey");
    const { username } = decodedToken;
    return res.status(200).json({ message: `Hello ${username}, you are authenticated to access this route.` });
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

// Add a book review
regd_users.put('/auth/review/:isbn', function(req, res) {
  const isbn = req.params.isbn;
  const review = req.body.review;
  const username = req.session.username;

  let booksList = Object.values(books)
  const book = booksList.find(b => b.isbn == isbn)
  // If the ISBN doesn't exist in the books object, send an error message
  if (!book) {
    res.status(404).send('The book with ISBN ' + isbn + ' does not exist.');
    return;
  }

  // If the user already posted a review for this book, modify the existing review
  if (book.reviews[username]) {
    book.reviews[username] = review;
    //res.json('Your review has been updated for the book with ISBN ' + isbn + ':'+ `${book}`);
    res.json(`Your review has been updated for the book ${book.title} by ${book.author} with ISBN ${isbn}: ==>${JSON.stringify(book)}`);

    return;
  }

  // If the user didn't post a review for this book, add a new review
  book.reviews[username] = review;
  //res.send('Your review has been posted for the book with ISBN ' + isbn + ':'+ `${book}`);
  res.json(`Your review has been posted for the book ${book.title} by ${book.author} with ISBN ${isbn}: ==>${JSON.stringify(book)}`);

});





regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn; // Get ISBN from the URL parameter.
  const username = req.session.username; // Get the username from the current session (logged-in user).

  if (!username) { // Check if the user is logged in.
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  // Find the book by its ISBN.
  const book = books[isbn];
  if (!book) { // If the book doesn't exist.
    return res.status(404).json({ message: "Book not found." });
  }

  // Check if the logged-in user has written a review for the book.
  if (book.reviews && book.reviews[username]) {
    delete book.reviews[username]; // Delete the review written by this user.
    return res.status(200).json({
      message: `Review by ${username} for book with ISBN ${isbn} deleted successfully.`,
      reviews: book.reviews, // Return the updated list of reviews.
    });
  } else { // If the user hasn't written a review for this book.
    return res.status(404).json({
      message: `No review found for user ${username} on book with ISBN ${isbn}.`,
    });
  }
});



module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
