const express = require('express');
let books = require("./booksdb.js");  // Assuming this file has the book database
let isValid = require("./auth_users.js").isValid;
const axios = require('axios');
let users = require("./auth_users.js").users;

const public_users = express.Router();

// Register a new user
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide a valid username and password' });
    }

    // Check if username already exists
    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(409).json({ message: 'Username already exists' });
    }

    // Add the new user to the users array
    users.push({ username, password });

    // Return a success message
    return res.status(200).json({ message: 'User registered successfully' });
});

// Get the book list available in the shop
public_users.get('/', (req, res) => {
    return res.status(200).json(books);  // Assuming books is an object, return the list as JSON
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];  // Assuming books is an object where ISBN is the key

    if (book) {
        return res.status(200).json(book);
    } else {
        return res.status(404).json({ message: "Book not found!" });
    }
});

// Get book details based on author (local filter, no external request)
public_users.get('/async/author/:author', (req, res) => {
    const author = req.params.author;
    const booksList = Object.values(books);  // Convert books object to array
    const booksByAuthor = booksList.filter(book => book.author.toLowerCase() === author.toLowerCase());

    if (booksByAuthor.length > 0) {
        return res.status(200).json(booksByAuthor);
    } else {
        return res.status(404).json({ message: `No books found by author "${author}"` });
    }
});

// Route to get books based on title using Async-Await (local filter)
public_users.get('/async/title/:title', async (req, res) => {
    const title = req.params.title;
    const booksList = Object.values(books);  // Convert books object to array
    const booksByTitle = booksList.filter(book => book.title.toLowerCase() === title.toLowerCase());

    if (booksByTitle.length > 0) {
        return res.status(200).json(booksByTitle);
    } else {
        return res.status(404).json({ message: `No books found with title "${title}"` });
    }
});

// Get book reviews based on ISBN
public_users.get('/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (book && book.reviews) {
        return res.status(200).json(book.reviews);
    } else {
        return res.status(404).json({ message: "Book not found or no reviews available" });
    }
});

// Add or modify a book review (use body instead of query params)
public_users.post('/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;  // Get ISBN from URL
    const review = req.body.review;  // Get review from body

    // Placeholder for authentication logic
    const username = "guest_user";  // Replace this with actual session-based username

    // Check if the ISBN exists in the books object
    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found." });
    }

    // Add or update the review
    if (!book.reviews) {
        book.reviews = {};  // Initialize reviews if missing
    }
    book.reviews[username] = review;  // Add/update review for the user

    // Respond with success message and updated reviews
    return res.status(200).json({
        message: `Review added/updated for book with ISBN ${isbn}`,
        reviews: book.reviews
    });
});

// Export the router
module.exports.general = public_users;
