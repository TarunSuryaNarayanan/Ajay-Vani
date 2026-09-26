import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ajay_vani_db';
    await mongoose.connect(connStr);
    console.log('✅ Connected to MongoDB Database successfully!');
  } catch (err) {
    console.warn('⚠️ Notice: Could not connect to MongoDB (Will use active In-Memory Database Mode):', err.message);
  }
};

export default connectDB;
