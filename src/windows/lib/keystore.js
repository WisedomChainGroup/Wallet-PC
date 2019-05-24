"use strict";

const AccountHandle = require('./account-handle');
const aesjs = require('./aes-js');
const keccak512 = require('./sha3').keccak512;
const argon2 = require('argon2');
const fs = require('fs');
const crypto = require('crypto');
const uuidV4 = require('uuid/v4');
const path = __dirname + "/../../../keystore/main";
const testpath = __dirname + "/../../../keystore/test";

class KeyStore {
    constructor() {
    }

    async Create (pwd,net) {
        let keyStore = {};
        const account = new AccountHandle().createAccount(net);
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
        const encryptedBytes = aesCtr.encrypt(account.secretKey);
        //加密过的私钥
        keyStore.crypto.ciphertext = aesjs.utils.hex.fromBytes(encryptedBytes);

        //用来比较解密密钥与口令的
        const dc = derivedKey.toString('hex') + keyStore.crypto.ciphertext;
        const dc_buf = Buffer.from(dc, 'hex');
        keyStore.mac = keccak512(dc_buf);
        //这是UUID，可以直接通过程序计算得到
        keyStore.id = uuidV4();

        return keyStore;
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
        const mac = keccak512(dc_buf);

        if(mac != keyStore.mac) return null;

        //私钥解密
        const vi = Buffer.from(keyStore.crypto.cipherparams.iv, 'hex');
        const aesCtr = new aesjs.ModeOfOperation.ctr(derivedKey, new aesjs.Counter(vi));
        var encryptedBytes = aesjs.utils.hex.toBytes(keyStore.crypto.ciphertext);
        var decryptedBytes = aesCtr.decrypt(encryptedBytes);
        return decryptedBytes;
    }

    Save (keystore,net) {
        let newpath;
        if(net == "main"){
            newpath = path;
        }else{
            newpath = testpath;
        }
        if(!fs.existsSync(newpath)) fs.mkdirSync(newpath);
        let time=new Date().getTime();
        const filePath = newpath + "/" + keystore.address+"@"+time;
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
        const filePath = path + "/" + fileName;
        if(fs.existsSync(filePath) == false) return null;
        const result = JSON.parse(fs.readFileSync( filePath));
        return result;
    }

    Readfull (filefullName){
        if(fs.existsSync(filefullName) == false) return null;
        const result = JSON.parse(fs.readFileSync( filefullName));
        return result;
    }

    async DecryptSecretKeyfull(keyStore, pwd) {
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
        const mac = keccak512(dc_buf);

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
        const mac = keccak512(dc_buf);

        if(mac != keyStore.mac){
            return null;
        }else{
            return 1;
        }
    }

    

    Check() {
    }
}

module.exports = KeyStore;
