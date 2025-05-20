import axios from 'axios';
import { initCetusSDK, TransactionUtil } from '@cetusprotocol/cetus-sui-clmm-sdk'
import 'dotenv/config';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';

async function getCoinMetadata(coinType){
    const response = await axios.post("https://fullnode.mainnet.sui.io", {
      jsonrpc: "2.0",
      id: 1,
      method: "suix_getCoinMetadata",
      params: [coinType]
    }, {
      headers: { "Content-Type": "application/json" }
    });
    return response.data.result;
}

export async function smartswap(fromCointype, toCointype, swapamount, slippage, priv_key, splitPoint = 0.5) {
    const sdk = initCetusSDK({ network: 'mainnet' })
    const fromCoin = fromCointype
    const toCoin = toCointype

    const coinAdata = await getCoinMetadata(fromCoin)
    const coinBdata = await getCoinMetadata(toCoin)

    if (!coinAdata){
      return new error('From coin Type is not valid')
    }

    if(!coinBdata){
      return new error('To coin Type is not valid')
    }

    const amount = Number(Number(swapamount) * 10 ** coinAdata.decimals);

    const byAmountIn = true
    const priceSplitPoint = splitPoint
    const partner = ''

    const keypair = Ed25519Keypair.fromSecretKey(fromBase64(priv_key).slice(1));
    sdk.senderAddress = keypair.getPublicKey().toSuiAddress();

    const result = (await sdk.RouterV2.getBestRouter(fromCoin, toCoin, amount, byAmountIn, priceSplitPoint, partner, undefined, undefined, true, false))
            .result

    let transferTxn

    if (!result?.isExceed) {
        const allCoinAsset = await sdk.getOwnerCoinAssets(sdk.senderAddress)
        const payload = await TransactionUtil.buildAggregatorSwapTransaction(sdk, result, allCoinAsset, '', slippage)
        transferTxn = await sdk.fullClient.sendTransaction(keypair, payload)
        
    }
    const amountOutHumanReadable = Number(result.outputAmount) / Math.pow(10, coinBdata.decimals);

  return {
    transferTxn : transferTxn,
    message: `You received ${amountOutHumanReadable} ${coinBdata.symbol} after swap`
  }
}