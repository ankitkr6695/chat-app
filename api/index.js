const express = require('express')
const app = express();
const mongoose = require('mongoose')
const User = require('./models/User.js')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const Message = require('./models/Message.js')
const ws = require('ws')
const fs = require('fs')
const multer = require("multer");
require('dotenv').config()
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())


//new cloudnary

//const uploadRoutes = require("./routes/upload.js");
//app.use("/api", uploadRoutes);
//end of upload routes

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));



const secretKey = process.env.JWT_SECRET
const bcryptSalt = bcrypt.genSaltSync(10);
app.get('/', function (req, res) {
  res.send('Hello World')
})

function getUserDataFromreq(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, secretKey, {}, (err, userData) => {
        if (err) {
          return res.status(401).json({ message: "Invalid token" });
        }
        resolve(userData);
      })

    } else {
      reject('no token')
    }
  })
}
app.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromreq(req);
  const ourUserId = userData.userId;
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] }
  }).sort({ createdAt: 1 })
  res.json(messages);
})

app.get('/people', async (req, res) => {
  const users = await User.find({}, { '_id': 1, username: 1 })
  res.json(users);
})

app.get('/profile', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, secretKey, {}, (err, userData) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      res.json(userData);
    })

  }
  else {
    res.status(422).json({ message: 'No token, authorization denied' })
  }

})

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password)
    if (passOk) {
      jwt.sign({ userId: foundUser._id, username }, secretKey, {}, (err, token) => {
        res.cookie('token', token).json({
          id: foundUser._id,
          username: foundUser.username
        })
      })
    }
  }
})

app.post('/logout', (req, res) => {
  res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok')
})
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
    const createdUser = await User.create({ username, password: hashedPassword })
    jwt.sign({ userId: createdUser._id, username }, secretKey, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token).status(201).json({ id: createdUser._id })
    })
  }
  catch (error) {
    res.status(400).json({ message: error.message })
  }

})




const server = app.listen(process.env.PORT);
const wss = new ws.WebSocketServer({ server });
wss.on('connection', (connection, req) => {

  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
      }))
    })
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer)
      connection.terminate();
      notifyAboutOnlinePeople()
    }, 1000)
  }, 5000);

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  })


  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='))
    if (tokenCookieString) {
      const token = tokenCookieString.split('=')[1];
      if (token) {
        jwt.verify(token, secretKey, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        })
      }
    }
  }

  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, file } = messageData;
    let fileName = null;
    if (file) {
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      fileName = Date.now() + '.' + ext;
      const path = __dirname + '/uploads/' + fileName;
      const bufferData = Buffer.from(file.data.split(',')[1], 'base64');
      // fs.writeFileSync(path, bufferData, ()=>{
      //   console.log('file saved:'+path);
      // });

      fs.writeFileSync(path, bufferData);
      console.log('File saved:', path);
    }
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? fileName : null,
      });
      [...wss.clients]
        .filter(c => c.userId === recipient)
        .forEach(c => c.send(JSON.stringify({
          text, sender: connection.userId,
          recipient,
          file: file ? fileName:null,
          _id: messageDoc._id
        })))
    }
  });

  //notify everyone about online people
  notifyAboutOnlinePeople();


})

