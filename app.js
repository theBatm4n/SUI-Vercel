import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import contractRoutes from './routes/contract.js';

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/contracts', contractRoutes);

// MongoDB connection
mongoose.connect('mongodb+srv://batmanking36:C04MODOv11Dl67Ht@cluster0.bzrytqk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(async () => {
  console.log('MongoDB connected...');
})
.catch(err => console.log(err));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});