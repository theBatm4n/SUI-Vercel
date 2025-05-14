import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import path, { dirname } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { Transaction } from '@mysten/sui/transactions';

export async function token_deploy(module_name, token_symbol, token_name, decimals, description, initial_amount, package_dir, privateKey) {
	console.log('Deploying token to SUI network');
    try {

		// Properly escape all parameters for shell execution
        const escaped = {
            module_name: module_name.replace(/'/g, "'\\''"),
            token_symbol: token_symbol.replace(/'/g, "'\\''"),
            token_name: token_name.replace(/'/g, "'\\''"),
            description: description.replace(/'/g, "'\\''"),
            package_dir: package_dir.replace(/'/g, "'\\''")
        };

		if (existsSync(package_dir)) {
			throw new Error(`Directory "${package_dir}" already exists! Aborting to prevent overwriting.`);
		}

        const command = `./generate_move.sh '${escaped.module_name}' '${escaped.token_symbol}' '${escaped.token_name}' ${decimals} '${escaped.description}' ${initial_amount} '${escaped.package_dir}'`;
		console.log('Executing:', command); // Debug output

        execSync(command, {
            stdio: 'inherit',
            shell: true
        });

		const priv_key = privateKey;
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
		const path_to_contract = path.join(dirname(fileURLToPath(import.meta.url)), `./${package_dir}/sources`);
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
		 const PackageID = result.objectChanges.find(
			change => change.type === 'published'
		)?.packageId;

		if (!PackageID) {
			throw new Error('Could not extract contract address from deployment result');
		}

		// Return all necessary data for database storage
		return {
			name: token_name,
			symbol: token_symbol,
			description: description,
			PackageID: PackageID,
			owner: keypair.toSuiAddress(),
			decimals: decimals,
			transactionData: result, 
			date: new Date() 
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