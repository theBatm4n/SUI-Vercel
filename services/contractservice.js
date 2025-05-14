import Contract from '../models/contract.js';

class ContractService {
  // Create new contract
  static async createContract(contractData) {
    try {
      const contract = new Contract({
        Name: contractData.name, 
        Symbol: contractData.symbol, 
        Description: contractData.description, 
        ContractAddress: contractData.contractAddress, 
        Owner: contractData.owner, 
        Decimals: contractData.decimals
      });;
      return await contract.save();
    } catch (error) {
      throw new Error(`Error creating contract: ${error.message}`);
    }
  }

  // Get all contracts
  static async getAllContracts() {
    try {
      return await Contract.find();
    } catch (error) {
      throw new Error(`Error fetching contracts: ${error.message}`);
    }
  }

  // Get contract by address
  static async getContractByAddress(address) {
    try {
      const contract = await Contract.findOne({ ContractAddress: address });
      if (!contract) throw new Error('Contract not found');
      return contract;
    } catch (error) {
      throw new Error(`Error fetching contract: ${error.message}`);
    }
  }
}

export default ContractService;