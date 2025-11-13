import mongoose from 'mongoose';

export const connectDB = async () => {
  const MONGO_URI =
    process.env.MONGODB_URI ||
    'mongodb+srv://jonathanlindev_db_user:479oE9t8kyyH11Ty@cluster0.oszcix0.mongodb.net/?appName=Cluster0';
  //      process.env.MONGODB_URI || 'mongodb://localhost:27017/espresso-chat';

  await mongoose
    .connect(MONGO_URI, {
      // sets the name of the DB that our collections are part of
      dbName: 'espresso-chat',
    })
    .then(() => console.log('Connected to Mongo DB.'))
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      // don't exit process, just log error and continue without db
      console.log('Continuing without database...');
    });
  mongoose.connect(MONGO_URI);
  mongoose.connection.once('open', () => {
    console.log('Connected to Database');
  });
};
