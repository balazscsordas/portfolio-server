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

const clientsSchema = new mongoose.Schema({
  trainerId: String,
  name: String,
  age: Number,
  basicInformation: String,
  allergies: String,
  injuries: String
})

const User = mongoose.model('User', usersSchema);
const Client = mongoose.model('Client', clientsSchema);

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

app.post("/api/registration", async (req, res) => {
  try {
    const firstName = req.body.registrationData.firstName;
    const username = req.body.registrationData.username;
    const password = req.body.registrationData.password;
    const foundUser = await User.findOne({username: username});
    if (foundUser) {
      res.json({message: "An account is already registered with your username, please log in."});
    } else {
      const hash = await bcrypt.hash(password, saltRounds);
        if(hash) {
          const user = new User({
            firstName: firstName,
            username: username,
            password: hash,
            bestScore: 0,
            posts: []
          });
          user.save(err => {
            if(err) {
              console.log(err);
            } else {
              res.json({message: "Registration was successful"});
            }
          })
        }
      }
  }
  catch(err) {
    console.log(err);
  }
})

// Login

app.post("/api/login", async (req, res) => {
  try {
    const username = req.body.loginData.username;
    const password = req.body.loginData.password;
    const foundUser = await User.findOne({username: username});
    if(foundUser && bcrypt.compareSync(password, foundUser.password)) {
      res.json({
        id: foundUser._id,
        firstName: foundUser.firstName, 
        username: foundUser.username, 
        bestScore: foundUser.bestScore, 
        message: "Success"});
    } else if(!foundUser) {
      res.json({message: "This username isn't registered"});
    } else if (foundUser && bcrypt.compareSync(password, foundUser.password) !== true) {
      res.json({message: "Password isn't valid"});
    }
  }
  catch(err) {
    console.log(err);
  }
})

// Patch Game new record

app.patch("/api/setNewRecord", async (req, res) => {
  try {
    const userId = req.body.id;
    const record = req.body.record;
    const response = await User.updateOne({ _id: userId }, { bestScore: record });
    res.json({message: "record modified"});
  } 
  catch(err) {
    console.log(err);
  }
})

// Filter ranklist - Gets the 10 best players, sorts them in order and sends back to frontend

app.get("/api/ranklist", async (req, res) => {
  try {
    const foundUsers = await User.find({ bestScore: {$gte: 1} }, 'firstName bestScore');
    res.json({foundUsers: foundUsers.sort((a, b) =>  b.bestScore - a.bestScore).slice(0, 10)});
  }
  catch (err) {
    console.log(err);
  }
})


// To-Do application add post

app.post("/api/toDoApplication/addPost", async (req, res) => {
  try {
    const userId = req.body.user.id;
    const post = req.body.postData;
    const foundUser = await User.findOne({ _id: userId });
    foundUser.posts.push(post);
    foundUser.markModified;
    foundUser.save();
    res.json({message: "post added"});
  }
  catch(err) {
    console.log(err);
  }
})


// To-Do application fetch user's posts

app.post("/api/toDoApplication/fetchPosts", async (req, res) => {
  try {
    const userId = req.body.userId;
    const foundUser = await User.findOne({ _id: userId });
    res.json({foundPosts: foundUser.posts});
  }
  catch(err) {
    console.log(err);
  }
});


// To-Do application delete user's post

app.post("/api/toDoApplication/deletePost", async (req, res) => {
  try {
    const index = req.body.index;
    const userId = req.body.userId;
    const foundUser = await User.findOne({ _id: userId });
    foundUser.posts.splice(index, 1);
    foundUser.markModified;
    foundUser.save();
    res.json({message: "post deleted"});
  }
  catch(err) {
    console.log(err);
  }
});


// Trainer App - Add new client

app.post("/api/trainer-app/add-new-client", async (req, res) => {
  try {
    const newClientData = req.body.clientData;
    const trainerId = req.body.trainerId;
    const client = new Client({
      trainerId: trainerId,
      name: newClientData.name,
      age: newClientData.age,
      basicInformation: newClientData.basicInformation,
      allergies: newClientData.allergies,
      injuries: newClientData.injuries
    });
    await client.save();
    res.json({message: "Client has been added"});
  }
  catch(err) {
    console.log(err);
  }
});


// Trainer App - Fetch clients

app.post("/api/trainer-app/fetch-clients", async (req, res) => {
  try {
    const userId = req.body.userId;
    const foundClients = await Client.find({ trainerId: userId });
    res.json({foundClients: foundClients});
  }
  catch(err) {
    console.log(err);
  }
})


// Trainer App - Save modified client data

app.post("/api/trainer-app/save-modified-client-data", async (req, res) => {
  try {
    const userId = req.body.userId;
    const data = req.body.data;
    await Client.updateOne({ trainerId: userId }, { basicInformation: data.basicInformation, allergies: data.allergies, injuries: data.injuries });
    res.json({message: "client data has been modified"});
  }
  catch(err) {
    console.log(err);
  }
})