const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const urlParser = require('url');
require('dotenv').config()

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// project starts here

// connect to database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

// defining the schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});

// defining the models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// create new user
app.post("/api/users", (req, res) => {
  User.findOne({ username: req.body.username }, (err, data) => {
    if (err) {
      console.log(err);
    } else if (!data){
      User.create({ username: req.body.username }, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          res.json({ _id: data._id, username: data.username });
        }
      });
    } else {
      res.json({ _id: data._id, username: data.username });
    }
  });
});

// get all users
app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.json(data);
    }
  });
});

// post an exercise
app.post("/api/users/:id/exercises", (req, res) => {
  User.findById(req.body._id, (err, data) => {
    if (err) {
      console.log(err);
    }
    Exercise.create({
      userId: req.body._id,
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: req.body.date ? new Date(req.body.date) : Date.now()
    }, (err, createdUser) => {
      if (err) {
        console.log(err);
      }
      res.json({
        _id: createdUser.userId,
        username: data.username,
        date: createdUser.date.toDateString(),
        duration: parseInt(req.body.duration),
        description: createdUser.description
      });
    });
  });
});

// get users exercise log
app.get("/api/users/:id/logs", (req, res) => {
  const parsedUrl = urlParser.parse(req.url, true).query;
  if (Object.keys(parsedUrl).length === 0) {
    User.findById(req.params.id, (err, userData) => {
      if (err) {
        console.log(err);
      } else {
        Exercise.find({ userId: req.params.id }, (err, exerciseData) => {
          let customLog = exerciseData.map(exercise => {
            return {
              description: exercise.description,
              duration: exercise.duration,
              date: exercise.date.toDateString()
            };
          });
          res.json({
            _id: userData._id,
            username: userData.username,
            count: customLog.length,
            log: customLog
          });
        });
      }
    });
  } else {
    const fromDate = new Date(parsedUrl.from), toDate = new Date(parsedUrl.to), limit = parseInt(parsedUrl.limit);
    User.findById(req.params.id, (err, userData) => {
      Exercise.find({ userId: req.params.id }).where('date').gte(fromDate).lt(toDate).limit(limit).exec((err, exerciseData) => {
        let customLog = [];
        customLog = exerciseData.map(exercise => {
          return {
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString()
          }
        });
        res.json({
          _id: req.params.id,
          username: userData.username,
          count: exerciseData.length,
          log: customLog
        });
      });
    });
  }
});