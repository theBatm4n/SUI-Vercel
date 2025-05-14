import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import path, { dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Transaction } from '@mysten/sui/transactions';
import ContractService from './services/contractservice.js'; 

export async function token_mint(){
	/*
	const publishID = token_deploy(
		'MyAgentdemo',    // module_name
		'DEM',         // token_symbol 
		'Agent Token DEMO', // token_name
		9,             // decimals
		'AI trading bot sui',  // description
		1000000000000 //initial_supply
	);
	console.log('Token created with ID:', publishID);
	*/
	const client = new SuiClient({
		url: getFullnodeUrl('testnet'),
	});

	const res = await client.getOwnedObjects({
        owner: "0x03f3c5b496a3587aa81b13d70c0681f3b468a6d282fa962b4a2db4ebec16fa6c",
        filter: {
            MatchAny: [
                {
                    StructType: "0xcca2795809a5a0327228eb430e578e2c4445d1af112b5eb4264b65ff8785c06d::aicoin::MyAgentdemoCap"
                },
            ],
        },
        options: {
            showType: true,
        },
    });

	const priv_key = process.env.PRIVATE_KEY;
	if (!priv_key) {
		console.log('Error: Priv Key not set in env');
		process.exit(1);
	}
	// Generate a new Ed25519 Keypair
	const keypair = Ed25519Keypair.fromSecretKey(fromBase64(priv_key).slice(1));

	const tx = new Transaction();
    // Define inputs (replace these with your actual values)
	const minterCapArg = res.data[0].data.objectId; // Object ID of MyAgentdemoCap
	console.log('Minter Cap:', minterCapArg);
	const amount = 1000;          // Amount to mint (u64)
	const recipient = "0x03f3c5b496a3587aa81b13d70c0681f3b468a6d282fa962b4a2db4ebec16fa6c";    // Recipient address

	// Add the moveCall with 3 arguments
	tx.moveCall({
	target: `0xcca2795809a5a0327228eb430e578e2c4445d1af112b5eb4264b65ff8785c06d::aicoin::mint`,
	arguments: [
		tx.object(minterCapArg),  // minter_cap (object reference)
		tx.object(amount),   // amount (u64)
		tx.object(recipient), // recipient (address)
	],
	});

	// Execute transaction
	const result = await provider.signAndExecuteTransactionBlock({
	signer: keypair,
	transactionBlock: tx,
	options: {
		showEffects: true,
		showEvents: true,
	},
	});
  
    console.log(result);
}

export async function token_deploy(module_name, token_symbol, token_name, decimals, description) {
    try {
		const command = `./generate_move.sh ${module_name} ${token_symbol} "${token_name}" ${decimals} "${description}"`;
        
        // Execute with proper escaping
        execSync(command, {
            stdio: 'inherit',
            shell: true
        });

		const priv_key = process.env.PRIVATE_KEY;
		if (!priv_key) {
			console.log('Error: Priv Key not set in env');
			process.exit(1);
		}
        // Generate a new Ed25519 Keypair
		const keypair = Ed25519Keypair.fromSecretKey(fromBase64(priv_key).slice(1));
		const lin = getFullnodeUrl('testnet');
        const client = new SuiClient({
            url: lin,
        });
        // Path to your Move project directory (contains Move.toml)
		const path_to_contract = path.join(dirname(fileURLToPath(import.meta.url)), './Token/sources');
		console.log('Building contract');
		
        const { dependencies, modules } = JSON.parse(
			execSync(`sui move build --dump-bytecode-as-base64  --path ${path_to_contract}`, {
				encoding: 'utf-8',
			}),
		);
		
        // Create and execute transaction
        console.log('Deploying contract');
		console.log(`Deploying from: ${keypair.toSuiAddress()}`);
       
		const deploy_trx = new Transaction();
		deploy_trx.setSender(keypair.getPublicKey().toSuiAddress());
		deploy_trx.setGasBudget(100000000);
		const [upgrade_cap] = deploy_trx.publish({
			modules,
			dependencies,
		});

		
		deploy_trx.transferObjects([upgrade_cap], keypair.getPublicKey().toSuiAddress());

		const txBytes = await deploy_trx.build({ client });
		const signature = (await keypair.signTransaction(txBytes)).signature;

		const simulationResult = await client.dryRunTransactionBlock({ transactionBlock: txBytes });
		if (simulationResult.effects.status.status === "success") {
		const result = await client.executeTransactionBlock({
			transactionBlock: txBytes,
			signature,
			options: {
				showBalanceChanges: true,
				showEffects: true,
				showEvents: true,
				showInput: true,
				showObjectChanges: true,
				showRawInput: false
			}
		});
		console.log("Result: ", result);

		 // Extract contract address from the result
		 const contractAddress = result.objectChanges.find(
			change => change.type === 'created' && change.objectType.includes('::')
		)?.objectId;

		if (!contractAddress) {
			throw new Error('Could not extract contract address from deployment result');
		}

		// Return all necessary data for database storage
		return {
			name: token_name,
			symbol: token_symbol,
			description: description,
			contractAddress: contractAddress,
			owner: keypair.toSuiAddress(),
			decimals: decimals,
			transactionData: result, // Optional: include full transaction data
			date: new Date() // Current timestamp
		};
		
		}
		else {
			console.log("Simulation failed: ", simulationResult);
            throw new Error('Transaction simulation failed');
		}
		
    } catch (error) {
        console.error('Error:', error);
    }
}