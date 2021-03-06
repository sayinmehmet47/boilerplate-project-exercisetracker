const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const { urlencoded } = require('body-parser');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(console.log('connected'));

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  log: [
    {
      date: {
        type: Date,
        default: Date.now(),
      },
      duration: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
    },
  ],
});

const User = mongoose.model('User', schema);

app.use(urlencoded({ extended: false }));
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', (req, res) => {
  console.log(req.body);
  const user = new User({ username: req.body.username });
  user.save((err, data) => {
    if (err) return res.send('Path `username` is required.');
    res.json({
      username: data.username,
      _id: data.id,
    });
  });
});

app.get('/api/users', (req, res) => {
  User.find({}, function (err, Users) {
    if (err) return done(err);

    if (Users) {
      res.json(Users);
    }
  });
});

app.post('/api/users/:id/exercises', (req, res) => {
  const id = req.params.id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;
  User.findByIdAndUpdate(
    id,
    {
      $push: {
        log: { date: date, duration: duration, description: description },
      },
    },
    { safe: true, upsert: true, new: true },
    function (err, data) {
      if (err) return res.send('fddsaf');
      if (data) {
        return res.json({
          _id: id,
          username: data.username,
          date: new Date(date).toDateString(),
          duration: JSON.parse(duration),
          description: description,
        });
      }
    }
  );
});

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;
  const { from, to, limit } = req.query;
  User.findById(id, (err, data) => {
    if (err) return console.log(err);

    if (!limit && !from && !to) {
      console.log('limitless and fromless');

      res.json({
        _id: id,
        username: data.username,
        count: data.log.length,
        log: data.log.map((e) => {
          return {
            description: e.description,
            duration: e.duration,
            date: new Date(e.date).toDateString(),
          };
        }),
      });
    }
    if (limit) {
      res.json({
        _id: id,
        username: data.username,
        log: data.log.slice(0, limit).map((e) => {
          return {
            description: e.description,
            duration: e.duration,
            date: new Date(e.date).toDateString(),
          };
        }),
      });
    }
    if (to && from) {
      const toDate = new Date(to).toISOString();
      const fromDate = new Date(from).toISOString();
      const dateFiltered = data.log.filter((e) => {
        const stringDate = new Date(e.date).toISOString();
        return stringDate < toDate && stringDate > fromDate;
      });

      return res.json({
        _id: id,
        username: data.username,
        from: new Date(from).toDateString(),
        to: new Date(to).toDateString(),
        count: dateFiltered.length,
        log: dateFiltered.map((e) => {
          return {
            description: e.description,
            duration: e.duration,
            date: new Date(e.date).toDateString(),
          };
        }),
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
