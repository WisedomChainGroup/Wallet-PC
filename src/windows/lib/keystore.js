"use strict";

const path = require("path")
const os = require("os")
const AccountHandle = require('./account-handle');
const aesjs = require('./aes-js');
const keccak256 = require('./sha3').keccak256;
const argon2 = require('argon2');
const fs = require('fs');
const crypto = require('crypto');
const uuidV4 = require('uuid/v4');
// let dir = __dirname.substring(0,__dirname.length-16); // let dir = "~/.keystore"
// const path = dir + "/keystore/main";
// const testpath = dir + "/keystore/test";
const bs58 = require('./base58');
const Uint64BE = require("int64-buffer").Uint64BE;
const nacl = require('./nacl.min.js');

let kspath;
let nodepath;
let dir;
var systemType=os.type();
if(systemType == "Darwin"){
    kspath = path.join(os.homedir(),'/Library/Wisdom/keystore');
    nodepath = path.join(os.homedir(),'/Library/Wisdom');
}else{
    dir = __dirname.substring(0,__dirname.length-16);
    kspath = path.join(path.join(dir,'\Wisdom'),'\keystore');
    nodepath = path.join(dir,'\Wisdom');
}

class KeyStore {
    constructor() {
    }

    async Create (pwd) {
        try {
            if(pwd.length>20 || pwd.length<8){
                return -1;
            }
            let keyStore = {};
            const account = new AccountHandle().createAccount();
            //地址
            keyStore.address = account.addr;
            keyStore.crypto = {};
            //使用的加密算法，默认为aes-256-ctr
            keyStore.crypto.cipher = "aes-256-ctr";
            //keyStore.crypto.ciphertext = "";
            keyStore.crypto.cipherparams = {};
            //算法所需的参数，随机生成
            keyStore.crypto.cipherparams.iv = crypto.randomBytes(16).toString('hex');  // must be 128 bit, random 

            //const aesCtr = new aesjs.ModeOfOperation.ctr(key_256, new aesjs.Counter(5));
            //var encryptedBytes = aesCtr.encrypt(textBytes);
            //密钥加密方法
            keyStore.kdf = "Argon2id";
            //Argon2id的参数，分别是散列计算的迭代次数，必须使用的存储器的大小以及可以并行计算散列的CPU数量
            keyStore.kdfparams = {};
            keyStore.kdfparams.timeCost = 4;
            keyStore.kdfparams.memoryCost = 20480;
            keyStore.kdfparams.parallelism = 2;
            //Argon2id哈希计算使用的盐值，随机生成32
            keyStore.kdfparams.salt = crypto.randomBytes(32).toString('hex'); // random
            //keystore格式的版本号，默认为1
            keyStore.version = "1";

            //私钥加密
            const salt = Buffer.from(keyStore.kdfparams.salt, 'hex');
            const options = {
                timeCost: 4, memoryCost: 20480, parallelism: 2, type: argon2.argon2id, hashLength: 32, 
                version: 0x13, raw: true, salt
            };
            const p1 = Buffer.from(pwd, 'ascii').toString('hex');
            const s1 = keyStore.kdfparams.salt + p1;
            const derivedKey = await argon2.hash(s1, options);

            const vi = Buffer.from(keyStore.crypto.cipherparams.iv, 'hex');
            const aesCtr = new aesjs.ModeOfOperation.ctr(derivedKey, new aesjs.Counter(vi));
            let _prikey = this.Bytes2Str(account.secretKey).substring(0,64);
            let prikey = Buffer.from(_prikey,'hex');
            const encryptedBytes = aesCtr.encrypt(prikey);
            //加密过的私钥
            keyStore.crypto.ciphertext = aesjs.utils.hex.fromBytes(encryptedBytes);

            //用来比较解密密钥与口令的
            const dc = derivedKey.toString('hex') + keyStore.crypto.ciphertext;
            const dc_buf = Buffer.from(dc, 'hex');
            keyStore.mac = keccak256(dc_buf);
            //这是UUID，可以直接通过程序计算得到
            keyStore.id = uuidV4();
            return keyStore;
        } catch (error) {
            return 5000;   
        }
    }

    EncryptSecretKey() {

    }

    //keystore路径和密码获取私钥
    async DecryptSecretKey(addr, pwd) {
        const keyStore = this.Read(addr);
        if(keyStore == null) return null;

        const salt = Buffer.from(keyStore.kdfparams.salt, 'hex');

        const options = {
            //memoryCost做了修改，修改成了20480，原因是与前面生成的参数不一致，改成一致
            timeCost: 4, memoryCost: 20480, parallelism: 2, type: argon2.argon2id, hashLength: 32, 
            version: 0x13, raw: true, salt
        };
        const p1 = Buffer.from(pwd, 'ascii').toString('hex');
        const s1 = keyStore.kdfparams.salt + p1;
        const derivedKey = await argon2.hash(s1, options);

        const dc = derivedKey.toString('hex') + keyStore.crypto.ciphertext;
        const dc_buf = Buffer.from(dc, 'hex');
        const mac = keccak256(dc_buf);

        if(mac != keyStore.mac) return null;

        //私钥解密
        const vi = Buffer.from(keyStore.crypto.cipherparams.iv, 'hex');
        const aesCtr = new aesjs.ModeOfOperation.ctr(derivedKey, new aesjs.Counter(vi));
        var encryptedBytes = aesjs.utils.hex.toBytes(keyStore.crypto.ciphertext);
        var decryptedBytes = aesCtr.decrypt(encryptedBytes);
        return decryptedBytes;
    }

    Save (keystore,net) {
        let newpath = kspath;
        if(!fs.existsSync(newpath)){
            if(systemType == "Darwin"){
                if(!fs.existsSync(path.join(os.homedir(),'/Library'))){
                    fs.mkdirSync(path.join(os.homedir(),'/Library'));
                }
                if(!fs.existsSync(path.join(path.join(os.homedir(),'/Library'),'Wisdom'))){
                    fs.mkdirSync(path.join(path.join(os.homedir(),'/Library'),'Wisdom'));
                }              
                fs.mkdirSync(newpath);
            }else{
                if(!fs.existsSync(path.join(dir,'\Wisdom'))){
                    fs.mkdirSync(path.join(dir,'\Wisdom'));
                }
                fs.mkdirSync(newpath);
            }
        }
        let time=new Date().getTime();
        const filePath = path.join(newpath,'/'+ keystore.address+"@"+time);
    //    const filePath = newpath + "/" + keystore.address+"@"+time;
        const content = JSON.stringify(keystore, null, 4);
        fs.writeFile(filePath, content, {flag: 'w'}, function (err) {
            if(err) {
                console.error(err);
            } else {
                console.log('keystore create success');
            }
         });
    }

    Read (fileName) {
        const filePath = kspath + "/" + fileName;
        if(fs.existsSync(filePath) == false) return null;
        const result = JSON.parse(fs.readFileSync(filePath));
        return result;
    }

    Readfull (filefullName){
        if(fs.existsSync(filefullName) == false) return null;
        const result = JSON.parse(fs.readFileSync( filefullName));
        return result;
    }

    async DecryptSecretKeyfull(keyStore, pwd) {
        try{
            if(keyStore == null) return null;

            const salt = Buffer.from(keyStore.kdfparams.salt, 'hex');

            const options = {
                //memoryCost做了修改，修改成了20480，原因是与前面生成的参数不一致，改成一致
                timeCost: 4, memoryCost: 20480, parallelism: 2, type: argon2.argon2id, hashLength: 32, 
                version: 0x13, raw: true, salt
            };
            const p1 = Buffer.from(pwd, 'ascii').toString('hex');
            const s1 = keyStore.kdfparams.salt + p1;
            const derivedKey = await argon2.hash(s1, options);

            const dc = derivedKey.toString('hex') + keyStore.crypto.ciphertext;
            const dc_buf = Buffer.from(dc, 'hex');
            const mac = keccak256(dc_buf);

            if(mac != keyStore.mac) return null;

            //私钥解密
            const vi = Buffer.from(keyStore.crypto.cipherparams.iv, 'hex');
            const aesCtr = new aesjs.ModeOfOperation.ctr(derivedKey, new aesjs.Counter(vi));
            var encryptedBytes = aesjs.utils.hex.toBytes(keyStore.crypto.ciphertext);
            var decryptedBytes=[];
            decryptedBytes = aesCtr.decrypt(encryptedBytes);
            var str="";
            var hexString = "0123456789ABCDEF";
            for(var i=0; i<decryptedBytes.length; i++)
                {
                    var tmp = decryptedBytes[i].toString(16);
                    if(tmp.length == 1)
                    {
                        tmp = "0" + tmp;
                    }
                    str += tmp;
                }
            return str;
        }catch (error) {
            return 5000;   
        }
    }

    async verifySecretKey(keyStore, pwd) {
        if(keyStore == null) return null;

        const salt = Buffer.from(keyStore.kdfparams.salt, 'hex');

        const options = {
            //memoryCost做了修改，修改成了20480，原因是与前面生成的参数不一致，改成一致
            timeCost: 4, memoryCost: 20480, parallelism: 2, type: argon2.argon2id, hashLength: 32, 
            version: 0x13, raw: true, salt
        };
        const p1 = Buffer.from(pwd, 'ascii').toString('hex');
        const s1 = keyStore.kdfparams.salt + p1;
        const derivedKey = await argon2.hash(s1, options);

        const dc = derivedKey.toString('hex') + keyStore.crypto.ciphertext;
        const dc_buf = Buffer.from(dc, 'hex');
        const mac = keccak256(dc_buf);

        if(mac != keyStore.mac){
            return null;
        }else{
            return 1;
        }
    }

    buf2hex(buffer) { // buffer is an ArrayBuffer
        return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
      }

      Hex2Array(hex) {
        // let ret = new Array();
        // for(let i=0; i<hex.length; i+=2) {
        //     ret.push(parseInt(hex.substr(i,2), 16));
        // }
        // return ret;
        return Buffer.from(hex, 'hex');
    }

    addressToPubkeyHash(address){
        try{
            let _r5 = new bs58().decode(address);
            let r5 = this.buf2hex(_r5);
            let r2 = r5.substring(0,r5.length-8);
            let r1 = r2.substring(2,r2.length)
            return r1;
        }catch (error) {
            return 5000;   
        }
    }

    pubkeyHashToaddress(pubkeyHash){
        try{
            let r1 = Buffer.from(pubkeyHash,'hex');
            let r2 = "00"+pubkeyHash;
            let a  = Buffer.from(r1, 'hex');
            let b = keccak256(a);
            let c =Buffer.from(b, 'hex');
            let r3 = keccak256(c);
            let b4 = r3.substring(0,8);
            let r5 = r2+b4;
            let r6 = new bs58().encode(this.Hex2Array(r5));
            return  r6;
        } catch (error) {
            return 5000;   
        }
    }
    

    verifyAddress(address){
        try{
            if(address==""||address==null){
                return -1;
            }
            if(address.substring(0,1) == 1){
                let _r5 = new bs58().decode(address);
                let a = Buffer.from(this.addressToPubkeyHash(address),'hex');
                let b = keccak256(a)
                let c =Buffer.from(b, 'hex');
                let r3 = keccak256(c);
                let b4 = r3.substring(0,8);
                let _b4 = this.Bytes2Str(_r5).substring(42,50);
                if(b4 == _b4){
                    return 0;
                }else{
                    return -2;
                }

            }else{
                return -1;
            }
        } catch (error) {
            return 5000;   
        }
    }

    prikeyToPubkey(prikey){
        try{
            const keyPair = new AccountHandle().createKeyPairBySecretKey(this.Hex2Array(prikey));
            return this.buf2hex(keyPair.publicKey);
        } catch (error) {
            return 5000;   
        }
    }

    pubKeyToadd(publicKey){
        let bufpublicKey = Buffer.from(publicKey, 'hex');
        let pub256 = keccak256(bufpublicKey);
        let bufPub256 = Buffer.from(pub256, 'hex');
        let r1 = crypto.createHash('ripemd160').update(bufPub256).digest('hex');
        let r2 = "00"+r1;
        let a  = Buffer.from(r1, 'hex');
        let b = keccak256(a);
        let c =Buffer.from(b, 'hex');
        let r3 = keccak256(c);
        let b4 = r3.substring(0,8);
        let r5 = r2+b4;
        let r6 = new bs58().encode(this.Hex2Array(r5));
        return r6;
    }

    async modifyPassword(ks,pwd,newpwd){
        try{
            if(pwd.length>20 || pwd.length<8){
                return -1;
            }
            let _prikey = await this.DecryptSecretKeyfull(ks, pwd);
            let keyStore = {};
            const account = new AccountHandle().createAccount();
            //地址
            keyStore.address = account.addr;
            keyStore.crypto = {};
            //使用的加密算法，默认为aes-256-ctr
            keyStore.crypto.cipher = "aes-256-ctr";
            //keyStore.crypto.ciphertext = "";
            keyStore.crypto.cipherparams = {};
            //算法所需的参数，随机生成
            keyStore.crypto.cipherparams.iv = crypto.randomBytes(16).toString('hex');  // must be 128 bit, random 

            //const aesCtr = new aesjs.ModeOfOperation.ctr(key_256, new aesjs.Counter(5));
            //var encryptedBytes = aesCtr.encrypt(textBytes);
            //密钥加密方法
            keyStore.kdf = "Argon2id";
            //Argon2id的参数，分别是散列计算的迭代次数，必须使用的存储器的大小以及可以并行计算散列的CPU数量
            keyStore.kdfparams = {};
            keyStore.kdfparams.timeCost = 4;
            keyStore.kdfparams.memoryCost = 20480;
            keyStore.kdfparams.parallelism = 2;
            //Argon2id哈希计算使用的盐值，随机生成32
            keyStore.kdfparams.salt = crypto.randomBytes(32).toString('hex'); // random
            //keystore格式的版本号，默认为1
            keyStore.version = "1";
            //私钥加密
            const salt = Buffer.from(keyStore.kdfparams.salt, 'hex');
            const options = {
                timeCost: 4, memoryCost: 20480, parallelism: 2, type: argon2.argon2id, hashLength: 32, 
                version: 0x13, raw: true, salt
            };
            const p1 = Buffer.from(newpwd, 'ascii').toString('hex');
            const s1 = keyStore.kdfparams.salt + p1;
            const derivedKey = await argon2.hash(s1, options);

            const vi = Buffer.from(keyStore.crypto.cipherparams.iv, 'hex');
            const aesCtr = new aesjs.ModeOfOperation.ctr(derivedKey, new aesjs.Counter(vi));
            let prikey = Buffer.from(_prikey,'hex');
            const encryptedBytes = aesCtr.encrypt(prikey);
            //加密过的私钥
            keyStore.crypto.ciphertext = aesjs.utils.hex.fromBytes(encryptedBytes);

            //用来比较解密密钥与口令的
            const dc = derivedKey.toString('hex') + keyStore.crypto.ciphertext;
            const dc_buf = Buffer.from(dc, 'hex');
            keyStore.mac = keccak256(dc_buf);
            //这是UUID，可以直接通过程序计算得到
            keyStore.id = uuidV4();
            return keyStore;
        }catch(error){
            return 5000;
        }
    }

    async keystoreToPubkey(keyStore,pwd){
        try{
            return this.prikeyToPubkey(await this.DecryptSecretKeyfull(keyStore, pwd));
        } catch (error) {
            console.log(error);
            return 3000;   
        }

    }

    async keystoreToPubkeyHash(keyStore,pwd){
        try{
            let pubkey = await this.keystoreToPubkey(keyStore,pwd);
            console.log(pubkey);
            let pub256 = keccak256(Buffer.from(pubkey,'hex'));
            let bufPub256 = Buffer.from(pub256, 'hex');
            let r1 = crypto.createHash('ripemd160').update(bufPub256).digest('hex');
        } catch (error) {
            console.log(error)
            return 5000;   
        }

    }


    Bytes2Str(arr){
        var str = "";
        for(var i=0; i<arr.length; i++){
            var tmp = arr[i].toString(16);
                if(tmp.length == 1){
                    tmp = "0" + tmp;
                }
            str += tmp;
        }
        return str;
    }

    mul(amount){
        var arr =amount.split(".");
        let newAmount=0;
        if(arr.length>1){
            if(arr[1].length>8){
         return -1;	
        }
        let len = arr[1].length;
        let decimal = arr[1];
        for(var i=0;i<(8-len);i++){
            decimal=decimal+"0";
        }
            newAmount =arr[0]+decimal;
        }else{
            newAmount = amount+"00000000";
        }
        return newAmount;
    }

    numberToString(arg) {
        if (typeof arg === 'string') {
          if (!arg.match(/^-?[0-9.]+$/)) {
            throw new Error(`while converting number to string, invalid number value '${arg}', should be a number matching (^-?[0-9.]+).`);
          }
          return arg;
        } else if (typeof arg === 'number') {
          return -1;
        } else if (typeof arg === 'object' && arg.toString && (arg.toTwos || arg.dividedToIntegerBy)) {
          if (arg.toPrecision) {
            return String(arg.toPrecision());
          } else { // eslint-disable-line
            return arg.toString(10);
          }
        }
        return -1;
      }

    ClientToTransferAccount(fromPubkeyStr,toPubkeyHashStr,amount,prikeyStr,nonce){
        try{
	        let isNum = this.numberToString(amount);
            if(isNum == -1){
                return 5000;
            }
            //版本号
            let version="01";
            //类型：WDC转账
            let type="01";
            //Nonce 无符号64位
            let _nonece=new Uint64BE((Number(nonce)+1).toString(),10).toString(16);
            let nonece = '0000000000000000'.substr(_nonece.length) + _nonece;
            //签发者公钥哈希 20字节
            let fromPubkeyHash = fromPubkeyStr;
            //gas单价  
	        let price = "4";
	        let _gasPrice=new Uint64BE(price,10).toString(16);
            let gasPrice = '0000000000000000'.substr(_gasPrice.length) + _gasPrice;
            //转账金额 无符号64位
            let mul = this.mul(amount);
            if(mul < 0){
            return 5000;
            }
            
            let _Amount=new Uint64BE(mul,10).toString(16);
            let Amount = '0000000000000000'.substr(_Amount.length) + _Amount;
	    //
            //为签名留白
            const buffersignull = Buffer.alloc(64);
            let signull = this.Bytes2Str(buffersignull);
            //接收者公钥哈希
            let toPubkeyHash=toPubkeyHashStr;
            //长度
            let allPayload= "00000000";
            let RawTransaction=Buffer.from(version+type+nonece+fromPubkeyHash+gasPrice+Amount+signull+toPubkeyHash+allPayload, 'hex');
            let a = version+type+nonece+fromPubkeyHash+gasPrice+Amount+signull+toPubkeyHash+allPayload;
            //签名数据
            let secretKey;
            if(prikeyStr.length == 128){
                secretKey = Buffer.from(prikeyStr, 'hex');
            }else{
                secretKey = Buffer.from(prikeyStr+fromPubkeyStr, 'hex');
            }
            let sigall = nacl.sign(RawTransaction,secretKey);
            let sigHex = this.Bytes2Str(sigall).substring(0,128);
            let _tra = version+type+nonece+fromPubkeyHash+gasPrice+Amount+sigHex+toPubkeyHash+allPayload;
            let tra = Buffer.from(_tra,'hex');
            let transha = keccak256(tra);
            let signRawBasicTransaction = version+transha+type+nonece+fromPubkeyHash+gasPrice+Amount+sigHex+toPubkeyHash+allPayload;
            return {
                'txHash': transha,
                'transaction': signRawBasicTransaction
            }
        } catch (error) {
            return 5000;   
        }
    }

    CreatePath(){
        if(systemType == "Darwin"){
            if(!fs.existsSync(nodepath)){
              if(!fs.existsSync(path.join(os.homedir(),'/Library'))){
                fs.mkdirSync(path.join(os.homedir(),'/Library'));
              }
              if(!fs.existsSync(path.join(path.join(os.homedir(),'/Library'),'Wisdom'))){
                  fs.mkdirSync(path.join(path.join(os.homedir(),'/Library'),'Wisdom'));
              }              
            }
          } else{
            if(!fs.existsSync(nodepath)){
               fs.mkdirSync(nodepath);
            }
          }
    }

    ModifyNode(nodeinfo){
        this.CreatePath();
        const filePath = path.join(nodepath,'/'+ "node");
        if(!fs.existsSync(filePath)){
            let node = {};
            node.nodeinfo = nodeinfo;
            const content = JSON.stringify(node, null, 4);
            fs.writeFile(filePath, content, {flag: 'w'}, function (err) {
                if(err) {
                    console.error(err);
                }
            });
        }else{
            const node = JSON.parse(fs.readFileSync(filePath));
            node.nodeinfo = nodeinfo;
            const content = JSON.stringify(node, null, 4);
            fs.writeFile(filePath, content, {flag: 'w'}, function (err) {
                if(err) {
                    console.error(err);
                } else {
                    console.log('nodeinfo change success');
                }
            });
        }
    }

    NodeInfo(){
        const filePath = path.join(nodepath,'/'+ "node");
        const node = JSON.parse(fs.readFileSync(filePath));
        let ip = node.nodeinfo;
        return ip;
    }

    Check() {
    }
}

module.exports = KeyStore;
