const PORT = 8000;
const axios = require('axios');
const express = require('express');
const cors = require('cors');
require ('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const corsOptions = require('./config/corsOptions')

const saltRounds = 10;

const app = express();

app.use(cors(corsOptions));

app.use(express.json());

app.listen(process.env.PORT || PORT, function() {
  console.log("Server is running on port " +PORT);
})

// Database Connection  //

main().catch(err => console.log(err));

async function main() {
  const dbURL = "mongodb+srv://" + process.env.DBID + ":" + process.env.DBPW + "@portfolio.ksequlk.mongodb.net/portfolioDB";
  await mongoose.connect(dbURL);
}

const postsSchema = new mongoose.Schema({
  title: String,
  content: String
});

const usersSchema = new mongoose.Schema({
  firstName: String,
  username: String,
  password: String,
  bestScore: Number,
  posts: [postsSchema]
});

const User = mongoose.model('User', usersSchema);

// First server request

app.get("/api/server-start-request", (req, res) => {
  res.json({message: "Server started"})
});

// Weather App //

app.post("/api/get-weather-data", async (req, res) => {
  try {
    const location = req.body.cityNameInput;
    const apiKey = process.env.WEATHERAPPKEY;
    const unit = req.body.radioInput;
    const url = process.env.WEATHERAPPURL + location + "&appid=" + apiKey + "&units=" + unit;
    const response = await axios.get(url);
    res.json(response.data);
  }
  catch (err) {
    res.json(err.response.data);
  }
});


// Registration

app.post("/api/registration", (req, res) => {

  const firstName = req.body.registrationData.firstName;
  const username = req.body.registrationData.username;
  const password = req.body.registrationData.password;

  User.findOne({username: username}, (err, foundUser) => {
    if (foundUser) {
      res.json({message: "An account is already registered with your username, please log in."})
    } else if (err) {
      console.log(err)
    } else {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if(err) {
          console.log("Error with password encryption in registration!");
        } else {
          const user = new User({
            firstName: firstName,
            username: username,
            password: hash,
            bestScore: 0
          })
          user.save(err => {
            if(err) {
              console.log(err);
            } else {
              res.json({message: "Registration was successful"})
            }
          })
        }
      })
    
    }
  });
})

// Login

app.post("/api/login", (req, res) => {
  const username = req.body.loginData.username;
  const password = req.body.loginData.password;

  User.findOne({username: username}, (err, foundUser) => { 
    if(foundUser && bcrypt.compareSync(password, foundUser.password)) {
      res.json({
        id: foundUser._id, 
        firstName: foundUser.firstName, 
        username: foundUser.username, 
        bestScore: foundUser.bestScore, 
        message: "Success"});
    } else if(!foundUser) {
      res.json({message: "This username isn't registered"})
    } else if (foundUser && bcrypt.compareSync(password, foundUser.password) !== true) {
      res.json({message: "Password isn't valid"});
    } else if(err) {
      console.log(err);
    }
  })
})

// Patch Game new record

app.patch("/api/setNewRecord", (req, res) => {
  const userId = req.query.id;
  const record = req.query.record;

  User.updateOne({ _id: userId }, { bestScore: record }, err => {
    if (!err) {
      console.log("Sikeres Módosítás");
    } else {
      console.log(err);
    }
  })
})

// Filter ranklist - Gets the 10 best players, sorts them in order and sends back to frontend

app.get("/api/ranklist", (req, res) => {

  User.find({ bestScore: {$gte: 1} }, 'firstName bestScore', (err, foundUsers) => {
    if (err) {
      console.log(err);
    } else if (foundUsers){
      res.json({foundUsers: foundUsers.sort((a, b) =>  b.bestScore - a.bestScore).slice(0, 10)});
    }
  })
})


// To-Do application add post

app.post("/api/toDoApplication/addPost", (req, res) => {
  const userId = req.body.user.id;
  const post = req.body.postData;

  User.findOne({ _id: userId }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      foundUser.posts.push(post);
      foundUser.markModified;
      foundUser.save((error, saveResult) => {
        !error 
          ? console.log("Successfully saved the document") 
          : console.log("Something went wrong while saving");
      })
    }
  })
})


// To-Do application fetch user's posts

app.post("/api/toDoApplication/fetchPosts", (req, res) => {
  const userId = req.body.userId;

  User.findOne({ __id: userId }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      res.json({foundPosts: foundUser.posts});
    }
  });
});


// To-Do application delete user's post

app.post("/api/toDoApplication/deletePost", (req, res) => {
  const postId = req.body.postId;
  const userId = req.body.userId;

  User.findOne({ _id: userId }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      foundUser.posts.id(postId).remove((removeError, removeResult) => {
        removeError && console.log(removeError);
      });
      foundUser.markModified;
      foundUser.save((error, saveResult) => {
        error && console.log(error);
      })
    }
  })
});