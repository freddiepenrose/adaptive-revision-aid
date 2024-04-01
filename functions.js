const { query } = require('express');
const connection = require('./database.js'); // Importing the database connection

function checkEmailExists(email, isParent, callback) {

    let query = "";
    // Changing the query depending on if they are a parent or not
    switch (isParent) {
        case true:
            query = "SELECT * FROM UserInfo WHERE parentEmail = ?";
            break;
        case false:
            query = "SELECT * FROM UserInfo WHERE userEmail = ?";
    }
    // Checking the database
    connection.query(query, [email], (error, results) => {
        if (error) {
            console.log(error);
            callback(error, false);  // Returning false as email has not been found
        } else {
            if (results.length > 0) { // Checking if any results are returned
                callback(null, true); // Email exists
            } else {
                callback(null, false); // Email does not exist
            }
        }
    })
}

function checkLength(input) {
    if (input.length > 255) {
        return false; // Returns false if input is greater than 255 chacaters
    } else {
        return true; // Returns true if input is less than 255 characters
    }
}

// Is the email in the correct format
function isValidEmail(email) {
    // Using regex to test if email is valid.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+$/;
    return emailRegex.test(email); // Return true if email valid return false if invalid
}

// Is the password 6 or more characters
function checkPasswordLength(password) {
    if (password.length < 6) {
        return false; // Returning false as password is too small
    }
    return checkLength(password) // Returns false if password is too big
}

// Is the password in the correct format
function isPasswordValid(password) {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*()-_+=|{}[\]:;<>,.?]).*$/;
    return passwordRegex.test(password); // Return true if password valid return false if invalid
}

const bcrypt = require('bcrypt'); // Importing the bcrypt library for hashing passwords

// Hash the inputed password
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(); // Generating a salt
    const hashedPassword = await bcrypt.hash(password, salt); // Hashing the password using the salt
    return hashedPassword;
}

// Comparing the inputed password with the one in the database
async function comparePasswords(inputedPassword, databasePassword) {
    return bcrypt.compare(inputedPassword, databasePassword) // Return true of false depending if the passwords are equal
        .then((result) => {
            return result;
        })
        .catch((error) => {
            console.error('Error comparing passwords:', error);
            throw error;
        }); // If theres an error output it to the console
}

function signupDataValidation(userEmail, userName, userPassword, parentEmail, parentName, parentPassword) {

    // Checking if the user email aready exist in the database

    checkEmailExists(userEmail, false, (error, exists) => {
        if (error) {
            console.log("An error occurred: ", error)
        } else
            if (!exists) {
                return "There is already an account with this user email."; // If the email does not exist return an error
            }
    })

    // Checking if user email is less than 255 characters
    if (!checkLength(userEmail)) { // If checkLength returns false
        return "User email needs to be less than 255 characters.";
    }

    // Checking if an user email address was inputed
    if (!userEmail) { // If userEmail is null
        return "You need to submit a user email address.";
    }

    // Checking if user email is a valid email address
    if (!isValidEmail(userEmail)) { // If isValidEmail returns false
        return "The user email address is not valid.";
    }

    // Checking if user name was inputed
    if (!userName) { // if userName is null
        return "You need to submit a user name.";
    }

    // Checking if user name is less than 255 characters
    if (!checkLength(userName)) { // If checkLength returns false
        return "User name needs to be less than 255 characters.";
    }

    // Checking if user password > 6 chacters and < 255 character
    if (!checkPasswordLength(userPassword)) { // If checkPasswordLength returns false
        return "User Password needs to be greater than 6 characters and less than 255.";
    }

    // Checking if password contains lower and upper case and a special character
    if (!isPasswordValid(userPassword)) { // If isPasswordValid returns false
        return "User password needs to contain atleats one upper and lower case character and a speical character.";
    }


    // Checking if the parent email aready exist in the database
    checkEmailExists(parentEmail, true, (error, exists) => {
        if (error) {
            console.log("An error occurred: ", error)
        } else
            if (!exists) {
                return "There is already an account with this parent email."; // If the email does not exist return an error
            }
    })

    // Checking if parent email is less than 255 characters
    if (!checkLength(parentEmail)) { // If checkLength returns false
        return "User email needs to be less than 255 characters.";
    }

    // Checking if a parent email address was inputed
    if (!parentEmail) { // If parentEmail returns null
        return "You need to submit a parent email address.";
    }

    // Checking if user email is a valid email address
    if (!isValidEmail(parentEmail)) { // If isValidEmail returns false
        return "The user email address is not valid.";
    }

    // Checking if parent name was inputed
    if (!parentName) { // If parentName is null
        return "You need to submit a user name.";
    }

    // Checking if parent name is less than 255 characters
    if (!checkLength(parentName)) { // If checkLength returns false
        return "User name needs to be less than 255 characters.";
    }

    // Checking if parent password > 6 chacters and < 255 character
    if (!checkPasswordLength(parentPassword)) { // If checkPasswordLength returns false
        return "Parent Password needs to be greater than 6 characters and less than 255.";
    }

    // Checking if password contains lower and upper case and a special character
    if (!isPasswordValid(parentPassword)) { // If isPasswordValid returns false
        return "Parent password needs to contain atleats one upper and lower case character and a speical character.";
    }

    return null; // If no error dont return anything
}

// Creating a new record for the user's question performance
function createQuestionPerformanceInfo(QuestionPerformanceData, callback) {
    const { userEmail, questionID, timesAnswered, timesCorrect, timesWrong, timesUnknown, accuracy, proficiencyLevel } = QuestionPerformanceData;

    const query = 'INSERT INTO QuestionPerformanceInfo (userEmail, questionID, timesAnswered, timesCorrect, timesWrong, timesUnknown, accuracy, proficiencyLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    connection.query(query, [userEmail, questionID, timesAnswered, timesCorrect, timesWrong, timesUnknown, accuracy, proficiencyLevel], (error, results) => {
        if (error) {
            console.error(error);
            callback(error, false); // Indicate failure
        } else {
            console.log("Question performance record inserted successfully");
            callback(null, true); // Indicate success
        }
    });
}

// Generating a blank performance record for every question
function generateQuestionPerformanceData(userEmail, callback) {
    const questionCount = 16; // Number of questions in the database

    for (let i = 1; i <= questionCount; i++) {
        const userData = { // Setting performance data as blank
            userEmail: userEmail,
            questionID: i,
            timesAnswered: 0,
            timesCorrect: 0,
            timesWrong: 0,
            timesUnknown: 0,
            accuracy: 0,
            responseTime: 0,
            proficiencyLevel: 1
        };

        createQuestionPerformanceInfo(userData, (error) => {
            if (error) {
                callback(error, null);
                return; // Exit loop if error occurs
            }
        });
    }
}

// Creating a new record for the user's topic performance
function createTopicPerformanceInfo(TopicPerformanceData, callback) {
    const { topicID, userEmail, timesAnswered, timesCorrect, timesWrong, timesUnknown, accuracy, proficiencyLevel } = TopicPerformanceData;

    const query = 'INSERT INTO TopicPerformanceInfo (topicID, userEmail, timesAnswered, timesCorrect, timesWrong, timesUnknown, accuracy, proficiencyLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    connection.query(query, [topicID, userEmail, timesAnswered, timesCorrect, timesWrong, timesUnknown, accuracy, proficiencyLevel], (error, results) => {
        if (error) {
            console.error(error);
            callback(error, false); // Indicate failure
        } else {
            console.log("Topic performance record inserted successfully");
            callback(null, true); // Indicate success
        }
    });
}

// Generating a blank performance record for every topic
function generateTopicPerformanceData(userEmail, callback) {
    const topicCount = 8; // Number of record it will generate
    topicList = ["1.1.1", "1.1.2", "1.1.3", "1.2.1", "1.2.2", "1.2.3", "1.2.4", "1.2.5"] // List of all the topics
    for (let i = 0; i <= topicCount - 1; i++) {
        const UserData = { // Setting performance data as blank
            topicID: topicList[i],
            userEmail: userEmail,
            timesAnswered: 0,
            timesCorrect: 0,
            timesWrong: 0,
            timesUnknown: 0,
            accuracy: 0,
            responseTime: 0,
            proficiencyLevel: 1
        };

        createTopicPerformanceInfo(UserData, (error) => {
            if (error) {
                callback(error, null);
                return; // Exit loop if error occurs
            }
        });
    }
}

// Calcualate accuracy
function calculateAccuracy(timesAnswered, timesCorrect) {
    if (timesAnswered === 0) { // Avoiding diving by 0
        return 0;
    }
    const accuracy = (timesCorrect / timesAnswered) * 100 // Find accuracy as a percent
    const roundedAccuracy = accuracy.toFixed(2); // Round to 2 decimal places
    return roundedAccuracy
}



// Updating the users qusetion performance
function updateQuestionPerformance(userEmail, questionID, answerType) {

    const query1 = "SELECT * FROM QuestionPerformanceInfo WHERE userEmail = ? AND questionID = ?"
    connection.query(query1, [userEmail, questionID], (error, results) => {
        if (error) {
            return console.error(error);
        }

        let timesAnswered = results[0].timesAnswered;
        let timesCorrect = results[0].timesCorrect;

        // Update timesCorrect based on the answerType
        if (answerType === "correct") {
            timesCorrect += 1; // Increment timesCorrect if the answer is correct
        }

        // Update timesAnswered based on the answerType
        timesAnswered += 1;


        let updateFields = "";
        switch (answerType) {
            case "correct":
                updateFields = "timesAnswered = timesAnswered + 1, timesCorrect = timesCorrect + 1";
                break;
            case "wrong":
                updateFields = "timesAnswered = timesAnswered + 1, timesWrong = timesWrong + 1";
                break;
            case "unknown":
                updateFields = "timesAnswered = timesAnswered + 1, timesUnknown = timesUnknown + 1";
            default:
                updateFields = "timesAnswered = timesAnswered + 1, timesUnknown = timesUnknown + 1";
        }
        const accuracy = calculateAccuracy(timesAnswered, timesCorrect)

        const query2 = `UPDATE QuestionPerformanceInfo SET ${updateFields}, accuracy = ? WHERE userEmail = ? AND questionID = ?`
        connection.query(query2, [accuracy, userEmail, questionID], (error, results) => {
            if (error) {
                return console.error(error);
            }
            console.log("Updated question performance")
        })
    })
}

//updateTopicPerformance("freddieepenrosee@gmail.com", "1.1.1", "wrong")

// Updating the users topic performance
function updateTopicPerformance(userEmail, topicID, answerType) {
    const query1 = "SELECT * FROM TopicPerformanceInfo WHERE userEmail = ? AND topicID = ?"
    connection.query(query1, [userEmail, topicID], (error, results) => {
        if (error) {
            return console.error(error);
        }

        let timesAnswered = results[0].timesAnswered;
        let timesCorrect = results[0].timesCorrect;

        // Update timesCorrect based on the answerType
        if (answerType === "correct") {
            timesCorrect += 1; // Increment timesCorrect if the answer is correct
        }

        // Update timesAnswered based on the answerType
        timesAnswered += 1;


        let updateFields = "";
        switch (answerType) {
            case "correct":
                updateFields = "timesAnswered = timesAnswered + 1, timesCorrect = timesCorrect + 1";
                break;
            case "wrong":
                updateFields = "timesAnswered = timesAnswered + 1, timesWrong = timesWrong + 1";
                break;
            case "unknown":
                updateFields = "timesAnswered = timesAnswered + 1, timesUnknown = timesUnknown + 1";
            default:
                updateFields = "timesAnswered = timesAnswered + 1, timesUnknown = timesUnknown + 1";
        }
        const accuracy = calculateAccuracy(timesAnswered, timesCorrect)

        const query2 = `UPDATE TopicPerformanceInfo SET ${updateFields}, accuracy = ? WHERE userEmail = ? AND topicID = ?`
        connection.query(query2, [accuracy, userEmail, topicID], (error, results) => {
            if (error) {
                return console.error(error);
            }
            console.log("Updated topic performance")
        })
    })
}


// Fetch a random question
function fetchRandomQuestion() {
    const query = "SELECT * FROM QuestionInfo ORDER BY RAND() LIMIT 1"; // Fetch one random question
    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error retrieving random question:", error);
            return;
        }
        return results[0].questionID; // Return the questionID
    })
}


// Fetch a random topic with an accuracy between a certain range
function fetchTopicByAccuracy(userEmail, accuracyRange,) {
    const query = `SELECT * FROM TopicPerformanceInfo WHERE accuracy BETWEEN ${accuracyRange} AND userEmail = ? ORDER BY RAND() LIMIT 1`;
    connection.query(query, [userEmail], (error, results) => {
        if (error) {
            console.error("Error retrieving topic: ", error);
            return null; // Returning nothing
        }
        if (results.length == 0) {
            return null;
        }
        return results[0].topicID // Return the topicID
    })
}


// Fetch a random quetsion from a specified topic
function fetchQuestionByTopic(topicID) {
    const query = "SELECT * FROM QuestionInfo WHERE topicID = ? ORDER BY RAND() LIMIT 1";
    connection.query(query, [topicID], (error, results) => {
        if (error) {
            console.error("Error retrieving question: ", error);
            return null; // Returning nothing
        }
        if (results.length == 0) {
            return null;
        }
        return results[0].questionID;
    })
}


// Fetch a question based on user performance
function fetchQuestion(userEmail) {
    // Generate random number between 1 and 10
    const randomNumber = Math.floor(Math.random() * 10) + 1;

    if (randomNumber <= 5) { // This executes 50% of the time

        let topicID = fetchTopicByAccuracy(userEmail, "0 AND 50");
        if (!topicID) {
            return fetchRandomQuestion();
        }
        let questionID = fetchQuestionByTopic(topicID);
        return questionID;


    } else if (randomNumber <= 8) { // This executes 30% of the time

        let topicID = fetchTopicByAccuracy(userEmail, "50 AND 80");
        if (!topicID) {
            return fetchRandomQuestion();
        }
        let questionID = fetchQuestionByTopic(topicID);
        return questionID;

    } else if (randomNumber <= 9) { // This executes 10% of the time

        let topicID = fetchTopicByAccuracy(userEmail, "80 AND 100");
        if (!topicID) {
            return fetchRandomQuestion();
        }
        let questionID = fetchQuestionByTopic(topicID);
        return questionID;

    } else {// This executes for the remaining 10%)

        return fetchRandomQuestion();
    }
}

// Getting an array containing total number of times correct, wrong and unknown
function getUserPerformance(userEmail, callback) {

    const query = `SELECT
        SUM(timesCorrect) AS totalTimesCorrect,
        SUM(timesWrong) AS totalTimesWrong,
        SUM(timesUnknown) AS totalTimesUnknown
        FROM TopicPerformanceInfo WHERE userEmail = ?`;

    connection.query(query, [userEmail], (error, results) => {
        if (error) {
            console.error("Error executing SQL query: " + error);
            callback(error, null);
            return;
        }

        // Extracting the results
        const totalTimesCorrect = results[0].totalTimesCorrect;
        const totalTimesWrong = results[0].totalTimesWrong;
        const totalTimesUnknown = results[0].totalTimesUnknown;
        const userStats = [totalTimesCorrect, totalTimesWrong, totalTimesUnknown]

        callback(null, userStats);
    });
}

function getUserAccuracy(userEmail, callback) {
    const query = "SELECT Accuracy FROM TopicPerformanceInfo WHERE userEmail = ?";

    connection.query(query, [userEmail], (error, results) => {
        if (error) {
            console.error("Error executing SQL query: " + error);
            callback(error, null);
            return;
        }

        // Extracting the accuracies into an array
        const accuracies = results.map(result => result.Accuracy);

        callback(null, accuracies); // Send back errors as null and data as the array
    });
}

module.exports = {
    checkEmailExists,//
    checkLength,//
    isValidEmail,//
    checkPasswordLength,//
    isPasswordValid,//
    hashPassword,//
    comparePasswords,//
    signupDataValidation,//
    generateQuestionPerformanceData,//
    generateTopicPerformanceData,//
    updateQuestionPerformance,//
    updateTopicPerformance,//
    fetchQuestion,//
    fetchRandomQuestion,//
    getUserPerformance,
    getUserAccuracy
};

