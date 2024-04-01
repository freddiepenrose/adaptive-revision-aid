// Importing libraries 
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

// Importing files
const publicDirectory = path.join(__dirname, "./public"); // The path for serving static files
const viewsDirectory = path.join(__dirname, "./views"); // The path for locating view templates
const connection = require("./database.js"); // Importing the database connection
const {
    checkEmailExists,
    checkLength,
    isValidEmail,
    checkPasswordLength,
    isPasswordValid,
    hashPassword,
    comparePasswords,
    signupDataValidation,
    generateQuestionPerformanceData,
    generateTopicPerformanceData,
    updateQuestionPerformance,
    updateTopicPerformance,
    fetchQuestion,
    getUserPerformance,
    getUserAccuracy
} = require("./functions.js"); // Importing functions from the functions file

// Setting up express webserver
const app = express(); // Create an Express instance
app.set("view engine", "hbs"); // Setting the view engine to Handlebars (hbs)
app.set("views", viewsDirectory); // Setting the directory where view templated are located

app.use(express.static(publicDirectory)); // Serving static files from the public directory
app.use(express.urlencoded({ extended: false }));  // Parsing incoming form data
app.use(express.json()); // Parsing incomming JSON data from requests
app.use(cookieParser()); // Using cookie-parser middleware for parsing cookies


// Defining the routes

// Homepage route
app.get("/", (req, res) => {
    const token = req.cookies.AuthToken; // Fetching the users token

    if (!token) { // If the user has no token
        let descriptionText = "This revision aid is designed to help GCSE students studying Computer Science"
        return res.render("index", { paragraphText: descriptionText }); // Rendering the index page with description
    }

    // Check that token is valid
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (error, decoded) => {
        if (error) { // If error whilst verifying token
            let descriptionText = "This revision aid is designed to help GCSE students studying Computer Science"
            return res.render("index", { paragraphText: descriptionText }); // Rendering the index page with description
        }
        let welcomeText = `Welcome back to the revision aid ${decoded.name}!`
        res.render("index", { paragraphText: welcomeText }); // Rendering the index page with the user's name
    })
});



// Quiz route
app.get("/quiz", (req, res) => {
    const token = req.cookies.AuthToken; // Fetching the users token

    if (!token) { // If the user has no token
        return res.status(401).render("error", { errorName: "401", errorDescription: "You need to sign in to access this page." }) // Render the error page
    }

    // Check that token is valid
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (error, decoded) => {
        if (error) { // If error whilst verifying token
            return res.status(401).render("error", { errorName: "401", errorDescription: "You need to sign in to access this page." }) // Render the error page
        }

        if (decoded.isParent) { // If isParent is true
            return res.status(403).render("error", { errorName: "403", errorDescription: "Only students can access this page." }) // Render the error page
        }

        const userEmail = decoded.email;
        // If the user is a student

        // Fetch a random question
        const questionID = fetchQuestion(userEmail);
        const query1 = "SELECT * FROM QuestionInfo WHERE questionID = ?"
        connection.query(query1, [questionID], (error, results) => {
            if (error) {
                console.error('Error retrieving random question:', error);
                return res.status(500).render("error", { errorName: "500", errorDescription: "Error fetching quetsion." }) // Render the error page
            }

            let question = results[0];
            const questionData = {
                questionID: question.questionID,
                question: question.question,
                answer1: question.answers[0],
                answer2: question.answers[1],
                answer3: question.answers[2],
                answer4: question.answers[3],
                topicID: question.topicID
            }

            const query2 = "SELECT * FROM TopicInfo WHERE topicID = ?"; // Fetching topic info
            connection.query(query2, [questionData.topicID], (error, results) => {
                if (error) {
                    console.error('Error retrieving random question:', error);
                    return res.status(500).render("error", { errorName: "500", errorDescription: "Error fetching quetsion." }) // Render the error page
                }
                let topicName = results[0].topicName;
                questionData.topicName = topicName;
            })

            const query3 = "SELECT * FROM QuestionPerformanceInfo WHERE questionID = ? AND userEmail = ?"; // Fetching user's previous performance
            connection.query(query3, [randomQuestion.questionID, userEmail], (error, results) => {
                if (error) {
                    console.error('Error retrieving random question:', error);
                    return res.status(500).render("error", { errorName: "500", errorDescription: "Error fetching quetsion." }) // Render the error page
                }

                let accuracy = results[0].accuracy;
                let timesAnswered = results[0].timesAnswered;

                questionData.accuracy = accuracy;
                questionData.timesAnswered = timesAnswered
            })

            res.render("quiz", { questionData: questionData }) // Rendering the quiz page
        });
    })
});




// Stats GET request route
app.get("/stats", (req, res) => {
    const token = req.cookies.AuthToken; // Fetching the users token

    if (!token) { // If the user has no token
        return res.status(401).render("error", { errorName: "401", errorDescription: "You need to sign in to access this page." }) // Render the error page
    }

    // Check that token is valid
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (error, decoded) => {
        if (error) { // If error whilst verifying token
            return res.status(401).render("error", { errorName: "401", errorDescription: "You need to sign in to access this page." }) // Render the error page
        }

        const email = decoded.email; // The email that made the request
        let userEmail = "";
        const isParent = decoded.isParent; // If the request is from a parent

        if (isParent) { // If the request is from a parent
            const query = "SELECT * FROM UserInfo WHERE parentEmail = ?";
            connection.query(query, [email], (error, results) => {
                if (error) {
                    console.error('Error retrieving random question:', error);
                    return res.status(500).render("error", { errorName: "500", errorDescription: "Error fetching user data" }) // Render the error page
                }
                userEmail = results[0].userEmail;

                getUserPerformance(userEmail, (error, userPerformanceData) => {
                    if (error) {
                        console.error('Error:', error);
                        return;
                    }
        
                    getUserAccuracy(userEmail, (error, accuracies) => {
                        if (error) {
                            console.error('Error:', error);
                            return;
                        }
                        console.log(accuracies);
                        // Pass accuracies to the Handlebars template
                        res.render("stats", { pieChart: userPerformanceData, barChart: accuracies }); // Rendering the stats page
                    });
                });
            })
        } else {
            userEmail = email;
            getUserPerformance(userEmail, (error, userPerformanceData) => {
                if (error) {
                    console.error('Error:', error);
                    return;
                }
    
                getUserAccuracy(userEmail, (error, accuracies) => {
                    if (error) {
                        console.error('Error:', error);
                        return;
                    }
                    console.log(accuracies);
                    // Pass accuracies to the Handlebars template
                    res.render("stats", { pieChart: userPerformanceData, barChart: accuracies }); // Rendering the stats page
                });
            });
        }
    })
});



// Login GET request route
app.get("/login", (req, res) => {
    res.render("login"); // Rendering the login page
});



// Login POST request route
app.post("/login", async (req, res) => {
    const email = req.body.email;
    const inputedPassword = req.body.password;
    const isParent = req.body.isParent ? true : false; // Is login sent by a parent?

    let query = ""; // Defing the query variable
    switch (isParent) {
        case true: // If login request is from a parent
            query = "SELECT * FROM UserInfo WHERE parentEmail = ?";
            break;
        case false: // If login request is from a student
            query = "SELECT * FROM UserInfo WHERE userEmail = ?";
            break;
    }
    // Get the user details from the database to check if they exist
    connection.query(query, [email], async (error, results) => { // Using async
        if (error) {
            console.log(error);  // Send error to console
            return res.status(500).render("error", { errorName: "500", errorDescription: "Error querying database!" }) // Render the error page
        }

        if (results.length === 0) { // If the length of results is 0 then there is no record for that email
            return res.render("login", { error: "Invalid email address." }); // Return error to user
        }

        let databaseHashedPassword = "";
        let name = "";
        switch (isParent) {
            case true: // If login request is from a parent
                databaseHashedPassword = results[0].parentHashedPassword;
                name = results[0].parentName;
                break;
            case false: // If login request is from a student
                databaseHashedPassword = results[0].userHashedPassword;
                name = results[0].userName;
                break;
        }

        const passwordsMatch = await comparePasswords(inputedPassword, databaseHashedPassword); // This is comparing the two passwords
        if (!passwordsMatch) { // If the passwords don't match
            return res.render("login", { error: "Invalid password." }); // Return error to user
        }

        // If the passwords macth
        const authTokenData = {
            email: email,
            name: name,
            isParent: isParent
        }

        const authToken = jwt.sign(authTokenData, process.env.SECRET_ACCESS_TOKEN, { expiresIn: "5d" });
        res.cookie("AuthToken", authToken, { httpOnly: false, maxAge: 432000000 });
        res.redirect("/") // Redirecting to the home page
    })
});


// Signup GET request route
app.get("/signup", (req, res) => {
    res.render("signup"); // Rendering the signup page
});



// Signup POST request route
app.post("/signup", async (req, res) => {
    let userEmail = req.body.userEmail;
    let userName = req.body.userName;
    let userPassword = req.body.userPassword;
    let parentEmail = req.body.parentEmail;
    let parentName = req.body.parentName;
    let parentPassword = req.body.parentPassword;
    let course = req.body.course;

    // Check if theres a data validation error
    const validationError = signupDataValidation(userEmail, userName, userPassword, parentEmail, parentName, parentPassword)
    if (validationError) { // If theres an error send it to the server
        return res.render("signup", { error: validationError }) // Returning it means I don't need an else statement below
    }

    let userHashedPassword = await hashPassword(req.body.userPassword); // Hashing user password
    let parentHashedPassword = await hashPassword(req.body.parentPassword); // Hashing parent password

    const query = "INSERT INTO UserInfo (userEmail, userName, userHashedPassword, parentEmail, parentName, parentHashedPassword, course) VALUES (?, ?, ?, ?, ?, ?, ?)"
    connection.query(query, [userEmail, userName, userHashedPassword, parentEmail, parentName, parentHashedPassword, course], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).render("error", { errorName: "500", errorDescription: "Internal Server Error!" }) // Render the error page
        }
        console.log("User info has been successfuly inserted")

        // Generate question data
        generateQuestionPerformanceData(userEmail, (error) => {
            if (error) {
                console.log(error)
            }
        });

        // Generate topic data
        generateTopicPerformanceData(userEmail, (error) => {
            if (error) {
                console.log(error)
            }
        });

        const authTokenData = {
            email: userEmail,
            name: userName,
            isParent: false
        }

        const authToken = jwt.sign(authTokenData, process.env.SECRET_ACCESS_TOKEN, { expiresIn: "5d" });
        res.cookie("AuthToken", authToken, { httpOnly: false, maxAge: 432000000 });
        res.redirect("/") // Redirecting to the home page
    })
});



// Answer POST request route
app.post("/answer", async (req, res) => {
    const chosenAnswer = req.body.answer;
    const questionID = req.body.questionID;
    const decoded = jwt.verify(req.cookies.AuthToken, process.env.SECRET_ACCESS_TOKEN); // Decoding the auth cookie to get email
    const userEmail = decoded.email

    const query1 = "SELECT correctAnswer FROM QuestionInfo WHERE questionID = ?"
    connection.query(query1, [questionID], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).render("error", { errorName: "500", errorDescription: "Internal Server Error!" }) // Render the error page
        }
        if (results.length !== 1) { // Checking if the question exists in database
            return res.status(400).render("error", { errorName: "400", errorDescription: "Question not found!" }) // Render the error page
        }

        const correctAnswer = results[0].correctAnswer;

        let answerType = "";
        if (chosenAnswer === "I don't know") {
            answerType = "unknown"; // If the user selected "I don't know"
        } else if (chosenAnswer === correctAnswer) {
            answerType = "correct"; // If user answered correct
        } else {
            answerType = "wrong"; // If user answered wrong
        }

        // Finding the topic ID
        const query2 = "SELECT * FROM QuestionInfo WHERE questionID = ?"
        connection.query(query2, [questionID], (error, results) => {
            if (error) {
                return console.error(error);
            }
            const topicID = results[0].topicID
            console.log(topicID)

            updateQuestionPerformance(userEmail, questionID, answerType)
            updateTopicPerformance(userEmail, topicID, answerType)

            res.json({ isCorrect: chosenAnswer == correctAnswer, correctAnswer: correctAnswer }) // Responding to the request
        })
    })
});



// 404 not found GET request route
app.use((req, res) => {
    res.status(404).render('error', { errorName: "404", errorDescription: "Page not found!" });
});

app.listen(3000, () => { // Starting the server on port 3000
    console.log("Server has started on port: 3000");
});