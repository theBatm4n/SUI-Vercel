import express from 'express';
import Contract from '../models/contract.js';
import ContractService from '../services/contractservice.js';
import { existsSync } from 'fs';
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
  console.log('Received request to deploy token');
  try {
    const privateKey = req.headers['x-private-key'];
    const {module_name, name, symbol, description, decimals, initial_supply, package_name } = req.body;

    // Validate inputs
    if (!module_name|| !name || !symbol || !description || decimals === undefined || !initial_supply || !package_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!privateKey) {
      return res.status(401).json({ error: 'Private key required' });
    }

    if (existsSync(package_name)) {
      return res.status(400).json({ error: `Directory "${package_name}" already exists! Aborting to prevent overwriting.` });
    }

    // Validate module/package name
    if (!/^[A-Z][a-zA-Z]*$/.test(module_name)) {
      return res.status(400).json({
        error: 'Module name must start with capital letter and contain no spaces or special characters or numbers'
      });
    }

    // Validate package name
    if (!/^[a-zA-Z]+$/.test(package_name)) {
      return res.status(400).json({
        error: 'Module name must contain only letters and numbers with no spaces'
      });
    }

    const dec = Number(decimals);
    const supply = Number(initial_supply);
        
    if (isNaN(dec) || isNaN(supply)) {
        return res.status(400).json({ error: 'Decimals and supply must be numbers' });
    }

    const data = await token_deploy(
      module_name,
      name,   
      symbol,        
      decimals,           
      description, 
      initial_supply,
      package_name,
      privateKey 
    );

    console.log('Token created with ID:', data);
    const newContract = await ContractService.createContract(data);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


export default router;