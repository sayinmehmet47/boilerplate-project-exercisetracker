const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const { urlencoded } = require('body-parser');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(console.log('connected'));

const schema = new mongoose.Schema({
  username: String,
  log: [
    {
      _id: String,
      username: String,
      date: Date,
      duration: Number,
      description: String,
    },
  ],
});

const User = mongoose.model('User', schema);

app.use(urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  console.log(req.body);
  const user = new User({ username: req.body.username });
  user.save((err, data) => {
    if (err) return console.log(err);
    res.json({
      username: data.username,
      _id: data.id,
    });
  });
});

app.post('/api/users/:id/exercises', (req, res) => {
  const id = req.params.id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;
  console.log(duration);
  console.log(id);
  User.findById(id, (err, user) => {
    console.log(user);
    if (err) return console.log(err);
    // user.count = user.count + 1;
    user.log.push({
      description: description,
      duration: duration,
      date: new Date(date).toDateString(),
    });
    user.save((err, data) => {
      if (err) return console.log(err);
      res.json({
        _id: id,
        username: data.username,
        date: new Date(date).toDateString(),
        duration: duration,
        description: description,
      });
    });
  });
});

app.get('/api/users/:id/logs', (req, res) => {
  const id = req.params.id;
  User.findById(id, (err, data) => {
    if (err) return console.log(err);
    res.json({
      _id: id,
      username: data.username,
      count: data.__v,
      log: data.log,
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
