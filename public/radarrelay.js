class RadarRelay{
  constructor(baseURL){
    this.baseURL = baseURL;
  }

  getOrderbookAsync(quote_token_address, base_token_address){
    let url = new URL(this.baseURL + 'orderbook');
    url.search = new URLSearchParams({
      baseTokenAddress: base_token_address,
      quoteTokenAddress: quote_token_address,
    });
    return new Promise(resolve =>{
      fetch(url)
      .then((resp) => resp.json())
      .then(function(data){
        resolve(data);
      })
      .catch(function(error){
        resolve(error);
      });
    });
  }

  getTokenPairsAsync(baseToken){
    let url = new URL(this.baseURL + 'token_pairs');
    url.search = new URLSearchParams({ tokenA: baseToken });
    return new Promise(resolve => {
      fetch(url)
      .then((resp) => resp.json())
      .then(function(tokenPairs) {
        resolve(tokenPairs);
      })
      .catch(function(error) {
        resolve(error);
      });
    });
  }

  getOrdersAsync(){
    return new Promise(resolve => {
      fetch(this.baseURL + 'orders')
      .then((resp) => resp.json())
      .then(function(orders) {
        resolve(orders);
      })
      .catch(function(error) {
        resolve(error);
      });
    });
  }
}
