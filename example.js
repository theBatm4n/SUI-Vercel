
try {
    const response = await fetch('http://localhost:8080/contracts/deploy', {
      method: 'POST',
      headers: {
        'X-Private-Key': 'your_wallet_private_key_here',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        module_name: "MyAwesomeToken",
        name: "Test Token",
        symbol: "XXX",
        description: "long description containing multiple words and special characters!",
        decimals: 9,
        initial_supply: 1000000
      })
    });
    const result = await response.json();
    console.log('Deployment result:', result);
  } catch (error) {
    console.error('Error:', error);
}

