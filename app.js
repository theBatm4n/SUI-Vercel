import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import contractRoutes from './routes/contract.js';

const app = express();
const port = process.env.PORT || 3000;
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

  deployToken()

})
.catch(err => console.log(err));


async function deployToken() {
  try {
    const response = await fetch('http://localhost:3000/contracts/deploy', {
      method: 'POST',
      headers: {
        'X-Private-Key': 'AJB1doINLUSHXFb9oUmPlLcPo4k5czIRTTy9KGlAhX1J',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        module_name: "MyAwesomeToken",
        name: "GGGGGGGGGG",
        symbol: "ALL",
        description: "comprehensive test token with a long description containing multiple words and special characters!",
        decimals: 9,
        initial_supply: 1000000,
      })
    });
    const result = await response.json();
    console.log('Deployment result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});