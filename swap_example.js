try {
    const response = await fetch('https://suicontract-coin.fly.dev/contracts/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-private-key': "...."
      },
      body: JSON.stringify({
        fromCointype: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        toCointype: "0x2::sui::SUI", 
        swapamount: 0.04, // in terms of from coin
        slippage: 0.1, // 0 to 1
        splitPoint: 0.1, // (optional) same as slippage but for getting the route, default value is 0.5 
      })
    });
    const result = await response.json();
    console.log('Deployment result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
  