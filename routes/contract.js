import express from 'express';
import Contract from '../models/contract.js';
import ContractService from '../services/contractservice.js';
import { token_deploy } from '../api.js';

const router = express.Router();

// Get all contracts
router.get('/', async (req, res) => {
  try {
    const contracts = await Contract.find();
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get contract by address
router.get('/:address', async (req, res) => {
  try {
    const contract = await Contract.findOne({ ContractAddress: req.params.address });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new contract
router.post('/deploy', async (req, res) => {
  try {
    const { name, symbol, description, decimals, initial_supply } = req.body;
    const data = await token_deploy(
      name,   
      symbol,        
      description, 
      decimals,           
      description, 
      initial_supply 
    );
    console.log('Token created with ID:', data);
    const newContract = await ContractService.createContract(data);
    res.status(201).json(newContract);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


export default router;