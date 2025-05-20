try {
  const response = await fetch('https://suicontract-coin.fly.dev/contracts/deploytransfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      module_name: "MyAwesomeToken", // for building contract 
      name: "Trade Token", 
      symbol: "ABC", 
      description: "description containing multiple words and special characters!",
      decimals: 5,
      initial_supply: 1000000000, // account for decimal (eg. if decimals = 5, then initial supply = 1000000000/10^5 = 10000
      transfer_address: '0x03f3c5b496a3587aa81b13d70c0681f3b468a6d282fa962b4a2db4ebec16fa6c',
      url:"https://i.ibb.co/SXytMt5b/panda.jpg" // token icon (optional)
    })
  });
  const result = await response.json();
  console.log('Deployment result:', result);
} catch (error) {
  console.error('Error:', error);
}



