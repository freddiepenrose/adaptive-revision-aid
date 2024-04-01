require("dotenv").config() // Allows me to store sensitive data
const mysql = require("mysql2"); // Import the mysql2 library

// Connecting to the database
const connection = mysql.createPool({
    host: "localhost", // Local IP addresss
    user: "root", // Default username
    password: process.env.DATABASE_PASSWORD, // Password stored in the database
    database: "revision_aid"
})

// Testing to see if database connection works
connection.getConnection((error, databaseConnection) => {
    if (error) {
        console.error("Error connecting to database:", error);
        return;
    }
    console.log("Connected to database");


    // Releasing the connection after checking if it works
    databaseConnection.release();
});

// Allowing other files to use the database connection
module.exports = connection;

