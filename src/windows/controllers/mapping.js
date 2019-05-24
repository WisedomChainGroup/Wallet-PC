
var Tx = require('ethereumjs-tx');
var Web3 = require('web3');
var fs = require('fs')

const ethers = require('ethers');
var jsonpath = __dirname+"/WisdomMapping.json";
var abi = require(jsonpath);

var address = "0xcb020d277fae7ae15acde57f4f68be57fe698c43";

var fs = require('fs');

var _abi = fs.readFileSync(jsonpath).toString();
var abi = JSON.parse(_abi);
var ejsabi = require('ethereumjs-abi')




const App = {
  web3: null,
  account: null, 
  meta: null,

  start: async function() {
    const { web3 } = this;
    //var abi = JSON.parse(_abi);

    try {
      // get contract instance
      const networkId = await web3.eth.net.getId();
      //const deployedNetwork = metaCoinArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(abi,address);
      // get accounts
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },

  selectAll: async function(){
  
  },

  save: async function(){
    const { web3 } = this;
    var remote = require('electron').remote;
     //以太地址
    var ethaddress=document.getElementById('ethaddress').value;
    
    var account;
    if(ethaddress == "" || ethaddress.length  != 42 || ethaddress.substring(0, 2) != "0x"){
        document.getElementById('ethaddress').value="";

        // const options = {
        //   title: '提示',
        //   message: "请输入正确的以太地址！",
        //   buttons: ['是']
        // }
        // remote.dialog.showMessageBox(options);
        alert("请输入正确的以太地址!");
        return false;
    }
    var {remote}=require('electron');
    //主网地址
    var mainaddress=document.getElementById('mainaddress').value;
    var network =  remote.getGlobal('network').someProperty;
    var netStr;
    if(network == "main"){
      netStr = "WX";
    }else{
      netStr = "WS";
    }
    if(mainaddress == "" || mainaddress.length  != 46){
        document.getElementById('mainaddress').value="";
        // const options = {
        //   title: '提示',
        //   message: "请输入正确的主链地址！",
        //   buttons: ['是']
        // }
        // remote.dialog.showMessageBox(options);
        alert("请输入正确的主链地址!");
        return false;
    }    
    if(mainaddress.substring(0,2) != netStr){
      // const options = {
      //   title: '提示',
      //   message: "请选择对应的网络！",
      //   buttons: ['是']
      // }
      // remote.dialog.showMessageBox(options);
      alert("请选择对应的网络!");
      return false;
    }
     
     const { isfreeze } = this.meta.methods;
     var isfreezeVal = await isfreeze().call();
     if(isfreezeVal == true){
      // const options = {
      //   title: '提示',
      //   message: "映射登记已结束！",
      //   buttons: ['是']
      // }
      // remote.dialog.showMessageBox(options);
      alert("映射登记已结束！");
      return false;
     }
     const { mainisExist } = this.meta.methods;
     var ismainisExist = await mainisExist(mainaddress).call();
     if(ismainisExist == true){
      // const options = {
      //   title: '提示',
      //   message: "该主链地址已登记！",
      //   buttons: ['是']
      // }
      // remote.dialog.showMessageBox(options);
      alert("该主链地址已登记！");
      return false;
     }

     const { ethisflag } = this.meta.methods;
    
    var value = await ethisflag(ethaddress).call();
    
    if(value == false){
      try {
      // const { register } = this.meta.methods;
      // await register(mainaddress).send({ from: ethaddress},function(err,result){
        $("#adddiv").hide();
        $("#searchdiv").hide();
      //_from为发起交易的地址
      var _from = document.getElementById('ethaddress').value;
      var _key = document.getElementById('privatekey').value
      var  key = _key.slice(2);
      var _web3 = new Web3("https://mainnet.infura.io/v3/79543b6dfd584232b0ecf740d9b0452b");
      var functionSig = _web3.utils.sha3("register(string)").substr(2,8)
      var gasPrice = web3.eth.getGasPrice();
      gasPrice.then(function (rs) {
        gasPrice=rs;
      })
      var gasLimit = 210000;
      //nonce随机数，这里取该账号的交易数量
       var number = _web3.eth.getTransactionCount(_from);
       var privateKey = new Buffer(key, 'hex');
       //gasPrice=100000
       var _gasPrice  = _web3.utils.toWei('0.001','ether');
       gasPrice = _web3.utils.fromWei(_gasPrice,'gwei');
      
       var paramsData = ejsabi.rawEncode(["string"],[mainaddress]).toString('hex');

      //  var abc = [{ "newAddr": "testAddress"}];
      web3.eth.getTransactionCount(_from, web3.eth.defaultBlock.pending).then(function(nonce){
        var rawTx = {
            nonce:web3.utils.toHex(nonce++),
            gasPrice: _web3.utils.toHex(gasPrice),
            gasLimit: _web3.utils.toHex(gasLimit),
            to: address,//接受方地址或者合约地址
            from:  _from,
            //value: '',//发送的金额，这里是16进制，实际表示发送256个wei
            data:'0x'+functionSig+paramsData
        }

        //使用私钥对原始的交易信息进行签名，得到签名后的交易数据
        var tx = new Tx(rawTx);
        tx.sign(privateKey);

        var serializedTx = tx.serialize();

        var tran = _web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
        tran.on('confirmation', (confirmationNumber, receipt) => {
          //console.log('confirmation: ' + confirmationNumber);
        });
        tran.on('receipt', receipt => {
          console.log('receipt:');
          console.log(receipt);
        });
        tran.on('transactionHash', hash => {
            console.log('hash');
            console.log(hash);            
        });  
        tran.on('error', (err)=>{
            alert('登记失败！请查询是否有足够余额或已经登记');
            console.log(err);        
        });
      })
       
      //  web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
      //      if (!err){
      //          console.log(hash);
      //      }else{
      //          console.log(err);
      //      }
      //  });
      }catch(error){
        alert("登记失败！清检查是否有足够余额或已经登记");
      }
    }else{
      alert("该以太地址已登记!");
      return false;
    }
  },

  search: async function(){
    
    try {
      const { ethisflag } = this.meta.methods;
      var ethaddress=document.getElementById('ethaddressVal').value;
      var isethisflag = await ethisflag(ethaddress).call();
      if(isethisflag == true){
        const { selectOne } = this.meta.methods;
        var value = await selectOne(ethaddress).call();
        document.getElementById('mainaddressVal').value=value;
      }else{
        alert("请先登记！");
      }
      
      // const { getethAddress } = this.meta.methods;
      // var isethisflag = await getethAddress(0).call({ from: ethaddress ,gas: 3141592});
    }catch(error){
      console.log(error);
      alert("请输入正确的以太地址！");
    }
},
  getbalance: async function(ethaddress){
    const { web3 } = this;
    //以太地址
    const { getBalance } = this.meta.methods;
    var value = await getBalance(ethaddress).call();
    return web3.utils.fromWei( value, 'ether');
  },
  checkEth: async function(ethaddress){
      
      const KeyStore = require('../lib/keystore');
      const keystore = new KeyStore();
      
      var password = document.getElementById("ethpass").value;
      var f = document.getElementById("ethfile").files;  
      var pa = f[0].path;
      var _json=keystore.Readfull(pa);
      var json = JSON.stringify(_json);
      
      if(password==""){
        alert("密码不能为空");
        return false;
      }

        ethers.Wallet.fromEncryptedJson(json, password).then(function(wallet) {
          document.getElementById("ethaddress").value = wallet.address;
          document.getElementById("privatekey").value =wallet.privateKey;
          $("#p2").addClass("intro");   
          $("#ethpass").addClass("intro");   
          $("#checkEth").addClass("intro");   
        }).catch(
          res => {
              alert("获取私钥失败，请检查keystore和密码是否正确！");
              return false;
          }
      );;
  },
};

window.App = App;

window.addEventListener("load", function() {
  if (window.ethereum) {
    // use MetaMask's provider
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable(); // get permission to access accounts
  } else {
    console.warn(
      "No web3 detected. Falling back to http://192.168.0.135:8481. You should remove this fallback when you deploy live",
    );
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/79543b6dfd584232b0ecf740d9b0452b"),
    );
  }

  $("#codes").blur(function(){
    var value =document.getElementById('codes').value;
    if (/^[A-Z]+$/.test(value)){  
        return true;   
    }else{
      alert("请输入大写英文字母");   
      return; 
    }    
  });

  $("#count").blur(function(){
    var value =document.getElementById('count').value;
    if (/^[0-9]+$/.test(value)){  
        return true;   
    }else{
      alert("请输入整数");   
      return; 
    }    
  });
  App.start();
});
