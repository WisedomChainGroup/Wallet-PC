var fs = require('fs')
const ethers = require('ethers');
var jsonpath = __dirname+"/WisdomMapping.json";
var abi = require(jsonpath);
var fs = require('fs');
const KeyStore = require('keystore_wdc');





const App = {
  selectAll: async function(){
  
  },

  save: async function(){
   
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
    
  },
  check: async function(ethaddress){
      
      
      const keystore = new KeyStore();
      
      var password = document.getElementById("frompass").value;
      var f = document.getElementById("fromfile").files;  
      var pa = f[0].path;
      var _json=keystore.Readfull(pa);
      var json = JSON.stringify(_json);
      
      if(password==""){
        alert("密码不能为空");
        return false;
      }

      try{
        var SecretKey=await keystore.verifySecretKey(json,password);
        if(SecretKey == null){
          alert("请检查keystore和密码是否正确！！");
          return false;
        }
        alert("对了");
      }catch(e){
        alert("请检查keystore和密码是否正确！！");
        return false;
      }

          keystore.DecryptSecretKeyfull(json,password);
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
