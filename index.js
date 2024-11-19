const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const {Schema} = mongoose;

const mongo_uri = process.env.MONGO_URI;
mongoose.connect(mongo_uri);

const userSchema = new Schema(
  {
    username: String
  }
);
const User = mongoose.model("User",userSchema);
const exerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model("Exercise",exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select("_id username");
  res.json(users);
})

app.post('/api/users', async (req, res) => {
  console.log(req.body);
  const {username} = req.body;
  const username_obj = new User({username: username});
  try{
    const user_track = await username_obj.save();
    console.log(user_track);
    res.json(user_track);
  }catch(err){
    console.log(err);
    res.send("Invalid user");
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const {_id} = req.params;
  const {description} = req.body;
  const {duration} = req.body;
  const {date} = req.body;
  try{
    const user_track = await User.findById(_id);
    const date_string = date ? new Date(date) : new Date();
    const exercise_obj = new Exercise({
      user_id: user_track._id,
      description,
      duration,
      date: date_string
    });
    const exercise_track = await exercise_obj.save();
    if(!user_track){
      res.send('The user is not found.');
    }else{
      res.json({
        _id: user_track._id,
        username: user_track.username,
        description: exercise_track.description,
        duration: exercise_track.duration,
        date: new Date(exercise_track.date).toDateString()
      });
    }
  }catch(err){
    console.log(err);
    res.send("Invalid server");
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const {_id} = req.params;
  const {from} = req.query;
  const {to} = req.query;
  const {limit} = req.query;
  const user_track = await User.findById(_id);
  let user_obj = {user_id: _id};
  let date_obj = {
    '$gte':new Date(from),
    '$lte':new Date(to)
  };
  if(!user_track){
    res.send('The user is not found.');
    return;
  }
  if(from){
    date_obj[0];
  }
  if(to){
    date_obj[1];
  }
  if(from || to){
    user_obj.date = date_obj;
  }
  const user_exercises = await Exercise.find(user_obj).limit(+limit ?? 30);
  const user_logs = user_exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }));
  const obj = {
    username: user_track.username,
    count: user_exercises.length,
    _id: user_track._id,
    log: user_logs
  }
  res.json(obj);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
