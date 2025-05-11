import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import path, { dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Transaction } from '@mysten/sui/transactions';


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
		}
		else {
		console.log("Simulation failed: ", simulationResult);
		}

		
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the main function
token_deploy(
    'MyAgentdemo',    // module_name
    'DEM',         // token_symbol 
    'Agent Token DEMO', // token_name
    9,             // decimals
    'AI trading bot sui',  // description
	1000000000000 //initial_supply
);