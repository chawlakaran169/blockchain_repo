const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://karanchayal2003:SZPXx6IwRN5KqE5q@cluster0.4bozufn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
     
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
