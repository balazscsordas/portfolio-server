const PORT = 8000;
const axios = require('axios');
const express = require('express');
const cors = require('cors');
require ('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const app = express();

app.use(cors());
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

const usersSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  bestScore: Number
});

const User = mongoose.model('User', usersSchema);

// Weather App //

app.post("/api/get-weather-data", (req, res) => {
  const location = req.body.cityNameInput;
  const apiKey = process.env.WEATHERAPPKEY;
  const unit = req.body.radioInput;
  const url = process.env.WEATHERAPPURL + location + "&appid=" + apiKey + "&units=" + unit;

    axios.get(url)
    .then (response => {
        res.json(response.data)
    })
    .catch (error => {
        res.json(error.response.data)
    });
  
});


// Registration

app.post("/api/registration", (req, res) => {

  const email = req.body.registrationData.email;
  const password = req.body.registrationData.password;
  const name = req.body.registrationData.name;

  User.findOne({email: email}, (err, foundUser) => {
    if (foundUser) {
      res.json({message: "An account is already registered with your email address Please log in."})
    } else if (err) {
      console.log(err)
    } else {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if(err) {
          console.log("Error with password encryption in registration!");
        } else {
          const user = new User({
            name: name,
            email: email,
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
  const email = req.body.loginData.email;
  const password = req.body.loginData.password;

  User.findOne({email: email}, (err, foundUser) => { 
    if(foundUser && bcrypt.compareSync(password, foundUser.password)) {
      res.json({name: foundUser.name, email: foundUser.email, bestScore: foundUser.bestScore, message: "Success"});
    } else if(!foundUser) {
      res.json({message: "This e-mail isn't registered"})
    } else if (foundUser && bcrypt.compareSync(password, foundUser.password) !== true) {
      res.json({message: "Password isn't valid"});
    } else if(err) {
      console.log(err);
    }
  })
})

// Patch Game new record

app.patch("/api/setNewRecord", (req, res) => {
  const email = req.query.email;
  const record = req.query.record;

  User.updateOne({ email: email }, { bestScore: record }, err => {
    if (!err) {
      console.log("Sikeres Módosítás");
    } else {
      console.log(err);
    }
  })
})

// Filter ranklist - Gets the 10 best players, sorts them in order and sends back to frontend

app.get("/api/ranklist", (req, res) => {

  User.find({ bestScore: {$gte: 1} }, 'name bestScore', (err, foundUsers) => {
    if (err) {
      console.log(err);
    } else if (foundUsers){
      res.json({foundUsers: foundUsers.sort((a, b) =>  b.bestScore - a.bestScore).slice(0, 10)});
    }
  })
})