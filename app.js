import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import contractRoutes from './routes/contract.js';

const app = express();
const port = process.env.PORT || 8080;
// Middleware
app.use(bodyParser.json());

// Routes
app.use('/contracts', contractRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI,{ 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(async () => {
  console.log('MongoDB connected...');

})
.catch(err => console.log(err));


// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});