import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
import { execSync } from 'child_process';
import { Transaction } from '@mysten/sui/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';

export async function generateMoveTemplate(
  module_name,
  token_name,
  token_symbol,
  decimals,
  description,
  initial_amount,
  privateKey
) {
  console.log('Deploying token to SUI network');
  try {
      // Create a temporary directory
      const tempDir = mkdtempSync(join(tmpdir(), 'sui-token-'));
      const package_dir = join(tempDir, module_name);
      try {
        const scriptPath = join(process.cwd(), 'generate_move.sh');
        const escaped = {
            module_name: module_name.replace(/'/g, "'\\''"),
            token_symbol: token_symbol.replace(/'/g, "'\\''"),
            token_name: token_name.replace(/'/g, "'\\''"),
            description: description.replace(/'/g, "'\\''"),
            package_dir: package_dir.replace(/'/g, "'\\''")
        };

        const lowerCaseSymbol = escaped.token_symbol.toLowerCase();
        
        const command = `"${scriptPath}" '${escaped.module_name}' '${escaped.token_symbol}' '${lowerCaseSymbol}' '${escaped.token_name}' ${decimals} '${escaped.description}' ${initial_amount} '${escaped.package_dir}'`;
          
          execSync(command, {
              stdio: 'inherit',
              shell: true
          });

          const priv_key = privateKey;
          if (!priv_key) {
              throw new Error('Private Key not provided');
          }
          
          const keypair = Ed25519Keypair.fromSecretKey(fromBase64(priv_key).slice(1));
          const client = new SuiClient({
              url: getFullnodeUrl('testnet'),
          });
          console.log('Building contract');
          // Build the contract from the temporary directory
          const { dependencies, modules } = JSON.parse(
            execSync(`sui move build --dump-bytecode-as-base64 --path ${package_dir}`, {
                encoding: 'utf-8'
            })
          );
          if (!modules || !dependencies) {
                console.log('Failed to build contract: No modules or dependencies found');
            }
          
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
          if (simulationResult.effects.status.status !== "success") {
              throw new Error('Transaction simulation failed');
          }

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

          // Extract contract address
          const PackageID = result.objectChanges.find(
              change => change.type === 'published'
          )?.packageId;

          if (!PackageID) {
              throw new Error('Could not extract contract address from deployment result');
          }

          return {
              name: token_name,
              symbol: token_symbol,
              description: description,
              PackageID: PackageID,
              owner: keypair.toSuiAddress(),
              decimals: decimals,
              transactionData: result.digest, 
              date: new Date() 
          };
          
      } finally {
          // Clean up the temporary directory
          rmSync(tempDir, { recursive: true, force: true });
      }
      
  } catch (error) {
      console.error('Error:', error);
      throw error; // Re-throw to handle in calling function
  }
}