import mongoose from 'mongoose';

const ContractSchema = new mongoose.Schema({
  Name: { 
    type: String, 
    required: true 
  },
  Symbol: { 
    type: String, 
    required: true 
  },
  Description: { 
    type: String, 
    required: true 
  },
  PackageID: { 
    type: String, 
    required: true, 
    unique: true 
  },
  Owner: { 
    type: String, 
    required: true 
  },
  Decimals: { 
    type: Number, 
    required: true 
  },
  url:{
    type: String, 
    required: false 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
});

const Contract = mongoose.model('Contract', ContractSchema);
export default Contract;