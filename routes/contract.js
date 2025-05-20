import express from 'express';
import Contract from '../models/contract.js';
import ContractService from '../services/contractservice.js';
import { generateMoveTemplate } from '../template.js'
import { deploy_and_transfer } from '../deploy_transfer.js';
import  { smartswap } from '../swap.js';

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
    const {module_name, name, symbol, description, decimals, initial_supply } = req.body;

    // Validate inputs
    if (!module_name|| !name || !symbol || !description || decimals === undefined || !initial_supply) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!privateKey) {
      return res.status(401).json({ error: 'Private key required' });
    }
    // Validate module/package name
    if (!/^[A-Z][a-zA-Z]*$/.test(module_name)) {
      return res.status(400).json({
        error: 'Module name must start with capital letter and contain no spaces or special characters or numbers'
      });
    }

    const dec = Number(decimals);
    const supply = Number(initial_supply);
        
    if (isNaN(dec) || isNaN(supply)) {
        return res.status(400).json({ error: 'Decimals and supply must be numbers' });
    }

    const data = await generateMoveTemplate(
      module_name,
      name,   
      symbol,        
      decimals,           
      description, 
      initial_supply,
      url,
      privateKey 
    );

    console.log('Token created with ID:', data);
    await ContractService.createContract(data);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.post('/deploytransfer', async (req, res) => {
  console.log('Received request to deploy and transfer token');
  try {
    const {module_name, name, symbol, description, decimals, initial_supply, transfer_address, url } = req.body;

    if (!module_name|| !name || !symbol || !description || decimals === undefined || !initial_supply || !transfer_address) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Validate module/package name
    if (!/^[A-Z][a-zA-Z]*$/.test(module_name)) {
      return res.status(400).json({
        error: 'Module name must start with capital letter and contain no spaces or special characters or numbers'
      });
    }


    const dec = Number(decimals);
    const supply = Number(initial_supply);
        
    if (isNaN(dec) || isNaN(supply)) {
        return res.status(400).json({ error: 'Decimals and supply must be numbers' });
    }
    
    const data =  await deploy_and_transfer(
      module_name,
      name,   
      symbol,        
      decimals,           
      description, 
      initial_supply,
      transfer_address,
      url 
    );

    console.log('Token created with ID:', data);
    await ContractService.createContract(data);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/swap', async (req, res) => {
  console.log('Received request to swap tokens');
  try {
    const privateKey = req.headers['x-private-key'];
    const {fromCointype, toCointype, swapamount, slippage, splitPoint} = req.body;

    if (!fromCointype|| !toCointype || !swapamount || !slippage) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!privateKey) {
      return res.status(401).json({ error: 'Private key required' });
    }

    const swapam = Number(swapamount);
    const slip = Number(slippage);
        
    if (isNaN(swapam) || isNaN(slip)) {
        return res.status(400).json({ error: 'swap amount and slippage must be numbers' });
    }
    
    const data =  await smartswap(
      fromCointype,
      toCointype,   
      swapamount,                   
      slippage,
      privateKey,
      splitPoint
    );

    console.log('swap made with', data);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


export default router;