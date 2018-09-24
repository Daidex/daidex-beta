const yo = require('yo-yo');
const layout = require('../layout');
const swal = require('sweetalert');
const Web3 = require('web3');
const select = require('./select');
//const ZeroEx = require('0x.js').ZeroEx;

module.exports = function () {
  let el = yo`
    <header>
        <nav class="menu">
          <div class="logo">
            <img src="./img/logo.png" alt="logo" width="130"/>
          </div>
          <ul class="items">
            <li class="item">
              <a href="#">Exchange</a>
            </li>
            <li class="item">
              <a href="#">How it works</a>
            </li>
            <li class="item">
              <a href="#">Terms & conditions</a>
            </li>
            <li class="header-accounts"><a href="javascript:void(0)" class="metamask"><span id="client-address"></span></a></li>
          </ul>
        </nav>
        <div class="container">
          <div class="row content">
            <div class="col description">
              <h1 class="title">Trade ERC20 tokens using your own wallet</h1>
              <p>You need to WRAP Ethereum to start trading. WETH is the base token in Daidex.</p>
              <p>ETH balance: <span id="eth-balance">-</span></p>
              <div class="input">
                <input id="amount-to-wrap" type="text" name="price" placeholder="amount to WRAP"/>
                <button class="btn blue" type="button" onclick=${wrap}>wrap</button>
              </div>
              <p>WETH balance: <span id="weth-balance">-</span></p>
              <div class="input">
                <input id="amount-to-unwrap" type="text" name="price" placeholder="amount to UNWRAP"/>
                <button class="btn blue" type="button" onclick=${unwrap}>unwrap</button>
              </div>
            </div>
            <div class="col form">
              <form class="" method="post">
              <div class="row input-inline">
              <div class="input col">
                  <div class="custom-select" id="tokenAList">
                    <select id="token-select1" onchange=${tokenSelected('token-select1')}>
                      <option value="0">Select a token</option>
                    </select>
                  </div>
                  <div class="input">
                    <table>
                      <tr>
                        <td>
                          <label for="price" >Balance:</label>
                        </td>
                        <td>
                          <label for="price" id="balanceA">-</label>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <div class="input">
                    <table>
                      <tr>
                        <td>
                          <label for="price">Trading availability:</label>
                        </td>
                        <td>
                          <label class="switch">
                            <input type="checkbox" class="checkbox" id="token-checkbox" onclick=${modifyAllowence} disabled>
                            <span class="slider round" id="token-span"></span>
                            <div class="loader" id="loader" hidden></div>
                          </label>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <div class="input">
                    <input id="taker-amount" type="text" name="price" onkeyup=${displayAmountToReceiveOrPay('amountToPay')} placeholder="amount to pay"/>
                  </div>
                </div>
                <div class="input col">
                  <div class="custom-select" id="tokenBList">
                    <select id="token-select2" onchange=${tokenSelected('token-select2')}>
                      <option value="0">Select a token</option>
                    </select>
                  </div>
                  <div class="input col">
                    <table>
                      <tr>
                        <td>
                          <label for="price">Balance:</label>
                        </td>
                        <td>
                          <label for="price" id="balanceB">-</label>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <div class="input col">
                    <input id="maker-amount" type="text" name="price" onkeyup=${displayAmountToReceiveOrPay('amountToReceive')} placeholder="amount to receive"/>
                  </div>
                </div>
              </div>
              <!--label for="price" id = "market-price">1 wETH = 100 BAT</label-->
              <button type="button" class="btn blue" onclick="exchange();">Exchange</button>
            </form>
          </div>
        </div>
      </div>
    </header>
  `;

  // global variables
  let networks;
  let clientAddress;
  let netId;
  let web3;
  let link = document.createElement("a");
  link.target = "_blank";
  let etherscanBaseURL = "";
  let orderbooks = {};
  const TOKEN_DECIMALS = 18;
  const DECIMALS_TO_SHOW = 9;
  let zeroEx;
  // BigNumber.config({ ERRORS: false });

  window.addEventListener('load', main());

  async function main(){
    // Detecting MetaMask Provider for web3
    if (typeof Web3.givenProvider == 'undefined') {
      link.innerText = "Go to metamask.io";
      link.href = "https://metamask.io/";
      swal({ title: "MetaMask plugin no detected.",
             text: 'To start trading please install MetaMask and fund your account.',
             icon: "info",
             button: true,
             content: link,
             dangerMode: false });
      // TODO block form and buttons
      return;
    }

    web3 = new Web3(Web3.givenProvider);

    clientAddress = await web3.eth.getAccounts().then( accounts => accounts[0]);

    if(clientAddress == undefined || clientAddress == null){
      swal({ title: "MetaMask wallet locked.",
             text: 'To start trading please log in to your MataMask wallet.',
             icon: "warning",
             button: true,
      });
      document.getElementById("client-address").innerHTML = "UNKNOWN";
      // TODO block form and buttons
      return;
    }

    // Load networks file
    await fetch("/networks.json")
    .then((resp) => resp.json())
    .then(function(data){ networks = data; })
    .catch(function(error){ console.error(error); });
    let clientAddressSubstr = clientAddress.substring(0, 8) +
                              "..." +
                              clientAddress.substring(clientAddress.length-6,
                                                      clientAddress.length);

    swal("MetaMask wallet connected.", "Address: " + clientAddressSubstr, "success");
    document.getElementById("client-address").innerHTML = clientAddressSubstr;
    web3.eth.getBalance(clientAddress, function(error, balance){
      document.getElementById("eth-balance").innerHTML = web3.utils.fromWei(balance);
    });
    netId = await web3.eth.net.getId();
    zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
      document.getElementById("weth-balance").innerHTML = parseFloat(
        ZeroEx.ZeroEx.toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
    });

    let tokenSelect1 = document.getElementById("token-select1");
    let tokenSelect2 = document.getElementById("token-select2");
    networks.Symbols.map(tokenSymbol => {
      let selectOption = document.createElement("option");
      selectOption.text = tokenSymbol;
      selectOption.value = tokenSymbol;
      tokenSelect1.add(selectOption);
      selectOption = document.createElement("option");
      selectOption.text = tokenSymbol;
      selectOption.value = tokenSymbol;
      tokenSelect2.add(selectOption);
    });
    // Load drop down menu
    select();
    // Subscribe to radarRelay web sockets
    subscribeToOrderbooksWebSockets();
    // Given the current ethereum network, assign a base ethersan url.
    switch (netId) {
      case 1: etherscanBaseURL = "https://etherscan.io/tx/";          break;
      case 42: etherscanBaseURL = "https://kovan.etherscan.io/tx/";   break;
      case 3: etherscanBaseURL = "https://ropsten.etherscan.io/tx/";  break;
      case 4: etherscanBaseURL = "https://rinkeby.etherscan.io/tx/";  break;
      default: etherscanBaseURL = "https://etherscan.io/tx/";
    }
  }

  // Function for sorting bids and asks from an orderbook
  // Receives an orderbook and returns an orderbook
  function sortOrderbook(orderbook){
    const sortedAsks = orderbook.asks.sort((orderA, orderB) => {
      const orderRateA = new BigNumber(orderA.takerTokenAmount).div(new BigNumber(orderA.makerTokenAmount));
      const orderRateB = new BigNumber(orderB.takerTokenAmount).div(new BigNumber(orderB.makerTokenAmount));
      return orderRateA.comparedTo(orderRateB);
    });
    const sortedBids = orderbook.bids.sort((orderA, orderB) => {
      const orderRateA = new BigNumber(orderA.makerTokenAmount).div(new BigNumber(orderA.takerTokenAmount));
      const orderRateB = new BigNumber(orderB.makerTokenAmount).div(new BigNumber(orderB.takerTokenAmount));
      return orderRateB.comparedTo(orderRateA);
    });
    sortedBids.map( bidOrder => {
      bidOrder.takerTokenAmount = new BigNumber(bidOrder.takerTokenAmount);
      bidOrder.makerTokenAmount = new BigNumber(bidOrder.makerTokenAmount);
      bidOrder.takerFee = new BigNumber(bidOrder.takerFee);
      bidOrder.makerFee = new BigNumber(bidOrder.makerFee);
      bidOrder.expirationUnixTimestampSec = new BigNumber(bidOrder.expirationUnixTimestampSec);
    });
    sortedAsks.map(askOrder => {
      askOrder.takerTokenAmount = new BigNumber(askOrder.takerTokenAmount);
      askOrder.makerTokenAmount = new BigNumber(askOrder.makerTokenAmount);
      askOrder.takerFee = new BigNumber(askOrder.takerFee);
      askOrder.makerFee = new BigNumber(askOrder.makerFee);
      askOrder.expirationUnixTimestampSec = new BigNumber(askOrder.expirationUnixTimestampSec);
    });
    return { 'asks': sortedAsks, 'bids': sortedBids };
  }

  const socket = new WebSocket('wss://ws.kovan.radarrelay.com/0x/v0/ws');

  socket.addEventListener('message', function (event) {
    data = JSON.parse(event.data)
    if(data.channel == 'orderbook'){
      orderbooks[data.quoteTokenAddress] = sortOrderbook(data.payload);
      console.log('Change detected in orderbook');
    }
  });

  // Function to subcribe to an orderbook
  function subscribeToOrderbooksWebSockets(){
    networks.Symbols.map( tokenSymbol => {
      if (tokenSymbol != "WETH"){
        socket.addEventListener('open', function (event) {
            socket.send(`{
              "type": "subscribe",
              "channel": "orderbook",
              "requestId": 1,
              "payload": {
                "baseTokenAddress": "${getTokenAddressBySymbol('WETH')}",
                "quoteTokenAddress": "${getTokenAddressBySymbol(tokenSymbol)}",
                "snapshot": true,
                "limit": 100
                }
              }`);
        });
      }
    });
  }

  // returns amount to pay given asks or bids orders and amount to pay
  // parameters:
  //   * amountToPay -> BigNumber
  //   * orders -> Array

  async function getAmountToReceive(amountToPay, orders){
    let amountToReceive = new BigNumber(0);
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    for(order of orders){
      let takerFilledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(
        ZeroEx.ZeroEx.getOrderHashHex(order));
      let takerFilledAmountCut = takerFilledAmount.div(new BigNumber(10**(TOKEN_DECIMALS - DECIMALS_TO_SHOW)));
      takerFilledAmountCut = new BigNumber(parseInt(takerFilledAmountCut.toNumber()));
      let rate = order.makerTokenAmount.div(order.takerTokenAmount);
      let makerFilledAmount = takerFilledAmount.times(rate);
      let makerFilledAmountCut = makerFilledAmount.div(new BigNumber(10**(TOKEN_DECIMALS - DECIMALS_TO_SHOW)));
      makerFilledAmountCut = new BigNumber(parseInt(makerFilledAmountCut.toNumber()));
      let takerTokenAmountCut = order.takerTokenAmount.div(new BigNumber(10**(TOKEN_DECIMALS - DECIMALS_TO_SHOW)));
      takerTokenAmountCut = new BigNumber(parseInt(takerTokenAmountCut.toNumber())).minus(takerFilledAmountCut);
      let makerTokenAmountCut = order.makerTokenAmount.div(new BigNumber(10**(TOKEN_DECIMALS - DECIMALS_TO_SHOW)));
      makerTokenAmountCut = new BigNumber(parseInt(makerTokenAmountCut.toNumber())).minus(makerFilledAmountCut);;
      if(takerTokenAmountCut.lt(amountToPay)) {
        amountToReceive = amountToReceive.plus(makerTokenAmountCut);
        amountToPay = amountToPay.minus(takerTokenAmountCut);
      } else {
        amountToReceive = amountToReceive.plus(amountToPay.times(rate));
        break;
      }
    }
    return amountToReceive;
  }

  async function displayAmountToReceiveOrPay(textBox){
    this.takerTokenSymbol = document.getElementById("token-select1").value;
    this.makerTokenSymbol = document.getElementById("token-select2").value;
    if(this.takerTokenSymbol == '0' || this.makerTokenSymbol == '0') return;
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    switch (textBox) {
      case 'amountToPay':
        // Read amount to pay
        let takerTokenAmount = parseFloat(document.getElementById('taker-amount').value);
        // validate amount
        if(takerTokenAmount <= 0 || isNaN(takerTokenAmount)) {
          document.getElementById('maker-amount').value = 0;
          return;
        }
        takerTokenAmount = ZeroEx.ZeroEx.toBaseUnitAmount(new BigNumber(takerTokenAmount), DECIMALS_TO_SHOW);
        let amountToReceive = new BigNumber(0);
        // check if paying with wETH
        if(this.takerTokenSymbol == 'WETH'){
          // Choose an orderbook according to the selected token pairs
          this.orderbook = orderbooks[getTokenAddressBySymbol(this.makerTokenSymbol)];
          console.log(orderbook);

          /*zeroEx.exchange.getOrdersInfoAsync(this.orderbook.bids).then( info => {
            console.log(info);
          });*/
          amountToReceive = await getAmountToReceive(takerTokenAmount, this.orderbook.bids);
        } else {
          // paying with another token receiving wETH
          this.orderbook = orderbooks[getTokenAddressBySymbol(this.takerTokenSymbol)];
          console.log(orderbook)
          amountToReceive = getAmountToReceive(takerTokenAmount, this.orderbook.asks);
        }
        document.getElementById("maker-amount").value = ZeroEx.ZeroEx.toUnitAmount(
          new BigNumber(parseInt(amountToReceive)), DECIMALS_TO_SHOW).toNumber();
        break;
      case "amountToReceive"://Pay with WETH
        document.getElementById("taker-amount").value = document.getElementById("maker-amount").value;
        break;
      default:
        console.error("textbox id not found");
    }
  }

  async function tokenSelected(tokenList){
    this.tokenSymbol = document.getElementById(tokenList).value;
    this.tokenAddress = getTokenAddressBySymbol(this.tokenSymbol);

    switch(tokenList){
      case "token-select1":
        zeroEx.token.getBalanceAsync(this.tokenAddress, clientAddress).then((balance) => {
          document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx
          .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
        });
        // Load token allowence
        zeroEx.token.getProxyAllowanceAsync(this.tokenAddress, clientAddress).then((tokenAllowenceAmount) => {
          if (tokenAllowenceAmount > 0)
            document.getElementById('token-checkbox').checked = true;
          else
            document.getElementById('token-checkbox').checked = false;
          document.getElementById('token-checkbox').disabled = false;
          document.getElementById('loader').hidden = true;
          document.getElementById('token-span').hidden = false;
        });
        if(this.tokenSymbol == "WETH"){
          document.getElementById("tokenBList").children[1].innerHTML = "ZRX";
          document.getElementById("token-select2").value = "ZRX";
          zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("ZRX"), clientAddress).then((balance) => {
            document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx
            .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
          });
        }else{
          document.getElementById("tokenBList").children[1].innerHTML = "WETH";
          document.getElementById("token-select2").value = "WETH";
          zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
            document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx
            .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
          });
        }
        break;
      case "token-select2":
        zeroEx.token.getBalanceAsync(this.tokenAddress, clientAddress).then((balance) => {
          document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx
          .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
        });
        if (this.tokenSymbol == "WETH"){
          document.getElementById("tokenAList").children[1].innerHTML = "ZRX";
          document.getElementById("token-select1").value = "ZRX";
          zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("ZRX"), clientAddress).then((balance) => {
            document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx
            .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(6);
          });
          zeroEx.token.getProxyAllowanceAsync(getTokenAddressBySymbol("ZRX"), clientAddress).then((tokenAllowenceAmount) => {
            if (tokenAllowenceAmount > 0)
              document.getElementById('token-checkbox').checked = true;
            else
              document.getElementById('token-checkbox').checked = false;
            document.getElementById('token-checkbox').disabled = false;
            document.getElementById('loader').hidden = true;
            document.getElementById('token-span').hidden = false;
          });
        }else{
          document.getElementById("tokenAList").children[1].innerHTML = "WETH";
          document.getElementById("token-select1").value = "WETH";
          zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
            document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx
            .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(6);
          });
          zeroEx.token.getProxyAllowanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((tokenAllowenceAmount) => {
            if (tokenAllowenceAmount > 0)
              document.getElementById('token-checkbox').checked = true;
            else
              document.getElementById('token-checkbox').checked = false;
            document.getElementById('token-checkbox').disabled = false;
            document.getElementById('loader').hidden = true;
            document.getElementById('token-span').hidden = false;
          });
        }
        break;
    }
  }


  async function modifyAllowence(){
    var checkedValue = document.getElementById('token-checkbox').checked;
    document.getElementById('token-checkbox').disabled = true;
    document.getElementById('loader').hidden = false;
    document.getElementById('token-span').hidden = true;
    let tokenSymbol = document.getElementById('token-select1').value;
    let tokenAddress = getTokenAddressBySymbol(tokenSymbol);
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    let msg;// msg can be an error if transaction rejected or tx hash if success
    if(checkedValue == true){
      try{
        msg = await enableTokenTrading(tokenAddress, clientAddress);
        link.href = etherscanBaseURL + String(msg);
        link.innerText = msg.substring(0, 8) +
                         "..." +
                         msg.substring(msg.length-6, msg.length);
        swal({
          title: "Transaction accepted.",
          text:  "Waiting transaction to be mined. Transaction id: ",
          icon: "info",
          button: false,
          content: link,
        });
        await zeroEx.awaitTransactionMinedAsync(msg, 1500);
        swal({
          title: tokenSymbol + " enabled for trading.",
          text:  "Transaction id: ",
          icon: "success",
          button: true,
          content: link,
        });
      }
      catch(error){
        console.log(error);
        msg = error;
      }
    } else {
      try{
        msg = await disableTokenTrading(tokenAddress, clientAddress);
        link.href = etherscanBaseURL + String(msg);
        link.innerText = msg.substring(0, 8) +
                         "..." +
                         msg.substring(msg.length-6, msg.length);
        swal({
          title: "Transaction accepted.",
          text:  "Waiting transaction to be mined. Transaction id: ",
          icon: "info",
          button: false,
          content: link,
        });
        await zeroEx.awaitTransactionMinedAsync(msg, 1500);
        swal({
          title: tokenSymbol + " disabled for trading.",
          text:  "Transaction id: ",
          icon: "success",
          button: true,
          content: link,
        });
      }catch(error){
        msg = error;
      }
    }
    loadTokenAllowence(tokenSymbol);
  }

  async function enableTokenTrading(tokenAddress, accountAddress){
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    const enableTx = await zeroEx.token.setUnlimitedProxyAllowanceAsync(
      tokenAddress,
      accountAddress,
      {
        // You can optionally pass in the gas price and gas limit you would like to use
        // gasLimit: 80000,
        // gasPrice: new BigNumber(10**10),
      }
    );
    return enableTx;
  }

  async function disableTokenTrading(tokenAddress, accountAddress){
    let amount = new BigNumber("0");
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    const disableTx = await zeroEx.token.setProxyAllowanceAsync(
      tokenAddress,
      accountAddress,
      amount,
      {
        // You can optionally pass in the gas price and gas limit you would like to use
        // gasLimit: 80000,
        // gasPrice: new BigNumber(10**10),
      }
    );
    return disableTx;
  }

  async function getTokenAllowence(symbol){
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    let balance = await zeroEx.token.getProxyAllowanceAsync(
      getTokenAddressBySymbol(symbol),
      clientAddress,
    );
    return balance.toNumber();
  }

  // Tokens have different addresses depending on the network
  function getTokenAddressBySymbol(symbol){
    switch (symbol) {
      case "WETH":
        switch (netId) {
          case 1:   return networks.Mainnet.WETH; break;
          case 3:   return networks.Ropsten.WETH; break;
          case 4:   return networks.Rinkeby.WETH; break;
          case 42:  return networks.Kovan.WETH;   break;
          default:  return undefined;
        }
        break;
      case "ZRX":
        switch (netId) {
          case 1:   return networks.Mainnet.ZRX;  break;
          case 3:   return networks.Ropsten.ZRX;  break;
          case 4:   return networks.Rinkeby.ZRX;  break;
          case 42:  return networks.Kovan.ZRX;    break;
          default:  return undefined;
        }
        break;
      case "DAI":
        switch (netId) {
          case 1:   return networks.Mainnet.DAI;  break;
          case 3:   return networks.Ropsten.DAI;  break;
          case 4:   return networks.Rinkeby.DAI;  break;
          case 42:  return networks.Kovan.DAI;    break;
          default:  return undefined;
        }
        break;
      case "DGD":
        switch (netId) {
          case 1:   return networks.Mainnet.DGD;  break;
          case 3:   return networks.Ropsten.DGD;  break;
          case 4:   return networks.Rinkeby.DGD;  break;
          case 42:  return networks.Kovan.DGD;    break;
          default:  return undefined;
        }
        break;
      case "MKR":
        switch (netId) {
          case 1:   return networks.Mainnet.MKR;  break;
          case 3:   return networks.Ropsten.MKR;  break;
          case 4:   return networks.Rinkeby.MKR;  break;
          case 42:  return networks.Kovan.MKR;    break;
          default:  return undefined;
        }
        break;
      case "REP":
        switch (netId) {
          case 1:   return networks.Mainnet.REP;  break;
          case 3:   return networks.Ropsten.REP;  break;
          case 4:   return networks.Rinkeby.REP;  break;
          case 42:  return networks.Kovan.REP;    break;
          default:  return undefined;
        }
        break;
      default:
        return undefined;
    }
  }

  async function loadTokenAllowence(symbol){
    if (await getTokenAllowence(symbol) > 0)
      document.getElementById('token-checkbox').checked = true;
    else
      document.getElementById('token-checkbox').checked = false;
    document.getElementById('token-checkbox').disabled = false;
    document.getElementById('loader').hidden = true;
    document.getElementById('token-span').hidden = false;
  }

  async function exchange(){
    this.takerTokenSymbol = document.getElementById("token-select1").value;
    this.makerTokenSymbol = document.getElementById("token-select2").value;
    let cond1 = this.takerTokenSymbol in networks.Kovan || this.takerTokenSymbol in networks.Mainnet;
    let cond2 = this.makerTokenSymbol in networks.Kovan || this.makerTokenSymbol in networks.Mainnet;
    let cond3 = this.makerTokenSymbol != this.takerTokenSymbol;
    let cond4 = "WETH" == this.makerTokenSymbol || "WETH" == this.takerTokenSymbol;
    this.takerAmount = parseFloat(document.getElementById("taker-amount").value);
    //this.makerAmount = parseFloat(document.getElementById("maker-amount").value);
    let cond5 = this.takerAmount > 0;
    let cond6 = document.getElementById("token-checkbox").checked;
    this.takerTokenBalance = parseFloat(document.getElementById("balanceA").innerHTML);
    let cond7 = this.takerTokenBalance >= this.takerAmount;
    if(!cond1){ swal("Token " + this.takerTokenSymbol + " not supported."); return;  }
    if(!cond2){ swal("Token " + this.makerTokenSymbol + " not supported."); return;  }
    if(!cond3 || !cond4){ swal("Please select a valid token pairs."); return; }
    if(!cond5){ swal("Please enter a valid amount."); return; }
    if(!cond6){ swal("You need to enable " + this.takerTokenSymbol + " for trading."); return; }
    if(!cond7){ swal("Insuficient funds for " + this.takerTokenSymbol); return; }
    // TODO get a relayer for every tesnets
    // TODO add more relayers
    switch (netId) {
      case 1: this.relayerURL = "https://api.radarrelay.com/0x/v0/";
        break;
      case 42: this.relayerURL = "https://api.kovan.radarrelay.com/0x/v0/";
        break;
      case 3: this.relayerURL = "https://api.radarrelay.com/0x/v0/";
        break;
      case 4: this.relayerURL = "https://api.radarrelay.com/0x/v0/";
        break;
      default: this.relayerURL = "https://api.radarrelay.com/0x/v0/";
    }
    const radarRelay = new RadarRelay(this.relayerURL);
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    if(this.takerTokenSymbol != "WETH") this.tokenA = this.takerTokenSymbol;
    else this.tokenA = this.makerTokenSymbol;
    // Requesting orderbook from RadarRelay
    let orderbookResponse = await radarRelay.getOrderbookAsync(
      getTokenAddressBySymbol(this.tokenA),
      getTokenAddressBySymbol("WETH")
    );
    const sortedOrderbook = sortOrderbook(orderbookResponse);
    const sortedAsks = sortedOrderbook.asks;
    const sortedBids = sortedOrderbook.bids;
    let ordersToFill = [];
    let takerTokenAmount = ZeroEx.ZeroEx.toBaseUnitAmount(new BigNumber(this.takerAmount), TOKEN_DECIMALS);
    // Paying with WETH, receiving another token
    if(this.takerTokenSymbol == "WETH"){
      // building batch orders to fill
      // TODO read amount of decimals from contract
      for(bidOrder of sortedBids){
        if(bidOrder.takerTokenAmount.lte(takerTokenAmount)) {
          ordersToFill.push({ signedOrder: bidOrder, takerTokenFillAmount: bidOrder.takerTokenAmount });
          takerTokenAmount.minus(bidOrder.takerTokenAmount);
        } else {
          ordersToFill.push({ signedOrder: bidOrder, takerTokenFillAmount: takerTokenAmount });
          break;
        }
      }
      // filling orders
      try {
        const fillTxHash = await zeroEx.exchange.batchFillOrdersAsync(ordersToFill, true, clientAddress);
        link.href = etherscanBaseURL + String(fillTxHash);
        link.innerText = "See transaction details";
        swal({
          title: "Transaction accepted.",
          text:  "Waiting transaction to be mined.",
          icon: "info",
          button: false,
          content: link,
        });
        const transactionData = await zeroEx.awaitTransactionMinedAsync(fillTxHash);
        let amountReceived = transactionData.logs[2].args.filledMakerTokenAmount;
        let amountPaid = transactionData.logs[2].args.filledTakerTokenAmount;
        swal({
          title: "Transaction confirmed. ",
          text:  `Amount received: ${ZeroEx.ZeroEx.toUnitAmount(amountReceived, TOKEN_DECIMALS)} ${this.makerTokenSymbol}
                  Amount paid: ${ZeroEx.ZeroEx.toUnitAmount(amountPaid, TOKEN_DECIMALS)} ${this.takerTokenSymbol}`,
          icon: "success",
          button: true,
          content: link,
        });
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol(this.makerTokenSymbol), clientAddress).then((balance) => {
          document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx.ZeroEx
          .toUnitAmount(balance,TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
        });
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol(this.takerTokenSymbol), clientAddress).then((balance) => {
          document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx.ZeroEx
          .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
        });
      }
      catch(error) {
        swal({
          title: "Something went wrong.",
          text:  error.message,
          icon: "error",
          button: true,
        });
      }
    // Paying with another token, receiving WETH
    }else{
      // building batch orders to fill
      for(askOrder of sortedAsks){
        if(askOrder.takerTokenAmount.lte(takerTokenAmount)) {
          ordersToFill.push({ signedOrder: askOrder, takerTokenFillAmount: askOrder.takerTokenAmount });
          takerTokenAmount.minus(askOrder.takerTokenAmount);
        } else {
          ordersToFill.push({ signedOrder: askOrder, takerTokenFillAmount: takerTokenAmount });
          break;
        }
      }
      // filling orders
      try {
        const fillTxHash = await zeroEx.exchange.batchFillOrdersAsync(ordersToFill, true, clientAddress);
        link.href = etherscanBaseURL + String(fillTxHash);
        link.innerText = "See transaction details";
        swal({
          title: "Transaction accepted.",
          text:  "Waiting transaction to be mined.",
          icon: "info",
          button: false,
          content: link,
        });
        const transactionData = await zeroEx.awaitTransactionMinedAsync(fillTxHash);
        let amountReceived = transactionData.logs[2].args.filledMakerTokenAmount;
        let amountPaid = transactionData.logs[2].args.filledTakerTokenAmount;
        swal({
          title: "Transaction confirmed. ",
          text:  `Amount received: ${ZeroEx.ZeroEx.toUnitAmount(amountReceived, TOKEN_DECIMALS)} ${this.makerTokenSymbol}
                  Amount paid: ${ZeroEx.ZeroEx.toUnitAmount(amountPaid, TOKEN_DECIMALS)} ${this.takerTokenSymbol}`,
          icon: "success",
          button: true,
          content: link,
        });
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol(this.makerTokenSymbol), clientAddress).then((balance) => {
          document.getElementById("balanceB").innerHTML = parseFloat(ZeroEx.ZeroEx
          .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
        });
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol(this.takerTokenSymbol), clientAddress).then((balance) => {
          document.getElementById("balanceA").innerHTML = parseFloat(ZeroEx.ZeroEx
          .toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(DECIMALS_TO_SHOW);
        });
      }catch(error) {
        swal({
          title: "Something went wrong.",
          text:  error.message,
          icon: "error",
          button: true,
        });
      }
    }
  }

  function wrap_ether(amount, weth_address){
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    return zeroEx.etherToken.depositAsync(
      weth_address,
      new BigNumber(amount * (10**TOKEN_DECIMALS)),
      clientAddress
    );
  }

  function unwrap_ether(amount, weth_address){
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    return zeroEx.etherToken.withdrawAsync(
      weth_address,
      new BigNumber(amount * (10**TOKEN_DECIMALS)),
      clientAddress
    );
  }

  async function wrap(){
    let amountToWrap = document.getElementById("amount-to-wrap").value;
    amountToWrap = parseFloat(amountToWrap);
    let ethBalance = await new Promise( (resolve) => {
      web3.eth.getBalance(clientAddress, function(error, balance){
        resolve(web3.utils.fromWei(balance));
      });
    });
    if(ethBalance > amountToWrap && amountToWrap > 0 && ethBalance > 0){
      let msg;
      msg = await wrap_ether(amountToWrap, getTokenAddressBySymbol("WETH"));
      if(String(msg).substring(0,2) != "0x") {
        swal({ title: "Error",
               text: String(msg),
               icon: "error",
               button: true,
               dangerMode: false,
        });
      }else{
        msg = String(msg);
        link.href = etherscanBaseURL + String(msg);
        link.innerText = msg.substring(0, 8) +
                         "..." +
                         msg.substring(msg.length-6, msg.length);
        swal({
          title: "Transaction accepted.",
          text:  "Waiting transaction to be mined. Transaction id: ",
          icon: "info",
          button: false,
          content: link,
        });
        const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
        let message = await zeroEx.awaitTransactionMinedAsync(msg, 1500);
        swal({
          title: "Transaction confirmed. ",
          text:  "Transaction id: ",
          icon: "success",
          button: true,
          content: link,
        });
        // Updating ETH/WETH balances
        web3.eth.getBalance(clientAddress, function(error, balance){
          document.getElementById("eth-balance").innerHTML = parseFloat(web3.utils.fromWei(balance)).toFixed(6);;
        });
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
          document.getElementById("weth-balance").innerHTML = parseFloat(ZeroEx.ZeroEx.toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(6);
        });
      }
    }else{
      swal("Insuficient funds/Invalid value.");
    }
  }

  async function unwrap(){
    let amountToUnWrap = document.getElementById("amount-to-unwrap").value;
    amountToUnWrap = parseFloat(amountToUnWrap);
    const zeroEx = new ZeroEx.ZeroEx(web3.currentProvider, { networkId: netId });
    let wethBalance = await zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress)
    if(wethBalance > amountToUnWrap && amountToUnWrap > 0 && wethBalance > 0){
      let msg;
      msg = await unwrap_ether(amountToUnWrap, getTokenAddressBySymbol("WETH"));
      if(String(msg).substring(0,2) != "0x"){
        swal({ title: "Error",
               text: String(msg),
               icon: "error",
               button: true,
               dangerMode: false,
        });
      }else{
        msg = String(msg);
        link.href = etherscanBaseURL + String(msg);
        link.innerText = msg.substring(0, 8) +
                         "..." +
                         msg.substring(msg.length-6, msg.length);
        swal({
          title: "Transaction accepted.",
          text:  "Waiting transaction to be mined. Transaction id: ",
          icon: "info",
          button: false,
          content: link,
        });
        let message = await zeroEx.awaitTransactionMinedAsync(msg, 1500);
        swal({
          title: "Transaction confirmed. ",
          text:  "Transaction id: ",
          icon: "success",
          button: true,
          content: link,
        });
        // Updating ETH/WETH balances
        web3.eth.getBalance(clientAddress, function(error, balance){
          document.getElementById("eth-balance").innerHTML = parseFloat(web3.utils.fromWei(balance)).toFixed(6);;
        });
        zeroEx.token.getBalanceAsync(getTokenAddressBySymbol("WETH"), clientAddress).then((balance) => {
          document.getElementById("weth-balance").innerHTML = parseFloat(ZeroEx.ZeroEx.toUnitAmount(balance, TOKEN_DECIMALS)).toFixed(6);
        });
      }
    }else{
      swal("Insuficient funds/Invalid value.");
    }
  }

  return layout(el);
}
