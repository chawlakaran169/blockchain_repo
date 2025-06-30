const express = require("express");
const app = express();
const port = 8080;
const path = require('path');
const mongoose = require("mongoose");
const User = require('./models/User');
const bcrypt = require('bcrypt');
const connectDB = require('./db');


connectDB(); 




const profilePics = [
  "/img/pfp1.jpg",
  "/img/pfp2.jpg",
  "/img/pfp3.jpg",
  "/img/pfp4.jpg"
];

// -------------middle ware ----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const session = require('express-session');
app.use(session({
  secret: 'blockchain_land_secret',
  resave: false,
  saveUninitialized: true
}));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ---------- views and static ----------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'fronted', 'views'));
app.use(express.static(path.join(__dirname, '..', 'fronted', 'public')));


// ---------------routes ---------------------
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/home'); // ✅ Already logged in
  res.render('login');
});

app.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/home'); // ✅ Already logged in
  res.render('signup');
});

// const uid = uuidv4();
const { v4: uuidv4 } = require('uuid');



app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.send(' User already exists');

   //  const hashedPassword = await bcrypt.hash(password, 10);
    const randomPic = profilePics[Math.floor(Math.random() * profilePics.length)];

    const user = new User({ 
      name,
       email,
        password,
         profilePic: randomPic 
        });
    await user.save();
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send(' Signup failed');
  }
});

// Remove old uid index if it exists
(async () => {
  try {
    await User.collection.dropIndex('uid_1');
    console.log('✅ Dropped old uid index');
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('✅ No uid index found (already gone)');
    } else {
      console.error('❌ Error dropping index:', err);
    }
  }
})();





app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.send(' Email not registered');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send(' Incorrect password');

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic
    };

    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.send(' Login failed');
  }
});
app.get('/home', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('home', { user: req.session.user });
});
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.listen(port,()=>{
    console.log(`listeninig to port ${port} successfully`);
});

// route for blockchain 

const Block = require('./models/block');
const { addNewBlock, getLastBlock, createGenesisBlock,calculateHash } = require('./utils/blockchain');
connectDB().then(createGenesisBlock);
app.get('/register_land', (req, res) => {
  res.render('register_land'); 
});
app.get('/transfer_land', (req, res) => {
  res.render('transfer_land');
});



// app.post('/register_land', async (req, res) => {
//   try {
//     if (!req.session.user) return res.redirect('/login');

//     const { land } = req.body;
//     if (!land) return res.send('❌ Land name is required');

//     const lastBlock = await getLastBlock();
//     const index = lastBlock ? lastBlock.index + 1 : 0;
//     const previousHash = lastBlock ? lastBlock.hash : '0';

//     const data = {
//       action: 'register',
//       land,
//       from: null,
//       to: req.session.user.email
//     };

//     const timestamp = new Date().toISOString();
//     const hash = calculateHash(index, timestamp, data, previousHash);

//     const newBlock = new Block({ index, timestamp, data, previousHash, hash });
//     await newBlock.save();

//     res.redirect('/home');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('❌ Error registering land');
//   }
// });

app.post('/register_land', async (req, res) => {
  try {
    const { uid, owner_name, owner_email, land_description } = req.body;

    const lastBlock = await getLastBlock();
    const index = lastBlock.index + 1;
    const previousHash = lastBlock.hash;
    const timestamp = new Date().toISOString();

    const data = { uid, owner_name, owner_email, land_description };
    const hash = calculateHash(index, timestamp, data, previousHash);

    const newBlock = new Block({
      index,
      timestamp,
      data,
      previousHash,
      hash
    });

    await newBlock.save();
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error registering land');
  }
});






app.post('/transfer_land', async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/login');

    const { land, toEmail } = req.body;
    if (!land || !toEmail) return res.send('❌ Both land and recipient email are required');

    const toUser = await User.findOne({ email: toEmail });
    if (!toUser) return res.send('❌ Recipient user not found');

    // Optional: check if this user owns the land (by searching blockchain)
    const history = await Block.find({ 'data.land': land }).sort({ index: 1 });
    if (!history.length) return res.send('❌ Land not found on blockchain');

    const currentOwner = history[history.length - 1].data.to;
    if (currentOwner !== req.session.user.email) {
      return res.send('❌ You do not own this land');
    }

    // Add transfer block
    const lastBlock = await getLastBlock();
    const index = lastBlock ? lastBlock.index + 1 : 0;
    const previousHash = lastBlock ? lastBlock.hash : '0';

    const data = {
      action: 'transfer',
      land,
      from: req.session.user.email,
      to: toEmail
    };

    const timestamp = new Date().toISOString();
    const hash = calculateHash(index, timestamp, data, previousHash);

    const newBlock = new Block({ index, timestamp, data, previousHash, hash });
    await newBlock.save();

    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error transferring land');
  }
});




app.get('/view_record', async (req, res) => {
  try {
    const { uid } = req.query;
    const records = await Block.find({ 'data.uid': uid });
    res.render('view_record', { records });
  } catch (err) {
    console.error(err);
    res.status(500).send(' Error retrieving record');
  }
});

app.get('/view_blockchain', async (req, res) => {
  try {
    const allBlocks = await Block.find().sort({ index: 1 });
    res.render('view_blockchain', { blockchain : allBlocks });
  } catch (err) {
    console.error(err);
    res.status(500).send(' Error viewing blockchain');
  }
});

app.get('/transfer_history', async (req, res) => {
  try {
    const chain = await Block.find().sort({ index: 1 });
    res.render('transfer_history', { chain });
  } catch (err) {
    console.error(err);
    res.status(500).send(' Error viewing blockchain');
  }
});

// User.collection.dropIndex('uid_1').catch(console.error);
(async () => {
  try {
    await User.collection.dropIndex('uid_1');
    console.log('✅ Dropped old uid index');
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('✅ No uid index found (already gone)');
    } else {
      console.error('❌ Error dropping index:', err);
    }
  }
})();
