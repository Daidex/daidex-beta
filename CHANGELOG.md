# Sept 2018
- Wrap/Unwrap functions where migrated from Web3 native transaction creation to `zeroEx.etherToken.withdrawAsync`
- Getting client address method changed from `clientAddress = web3.eth.coinbase` to `await web3.eth.getAccounts().then( accounts => accounts[0])`
- Getting networtk id method changed from `web3.version.getNetwork` to `netId = await web3.eth.net.getId()`
- Converting to baseUnit method chenged from `web3.fromWei(balance)` to `web3.utils.fromWei(balance)`
