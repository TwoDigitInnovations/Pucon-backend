const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Get the categories collection
    const db = mongoose.connection.db;
    const categoriesCollection = db.collection('categories');

    // List all indexes
    const indexes = await categoriesCollection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the problematic index if it exists
    try {
      await categoriesCollection.dropIndex('category_1');
      console.log('Successfully dropped category_1 index');
    } catch (error) {
      console.log('Index category_1 does not exist or already dropped');
    }

    // List indexes again to confirm
    const updatedIndexes = await categoriesCollection.indexes();
    console.log('Updated indexes:', updatedIndexes);

    console.log('Index cleanup completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropIndexes(); 