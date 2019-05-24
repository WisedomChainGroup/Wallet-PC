"use strict";

const bs58 = require('./base58');
const keccak512 = require('./sha3').keccak512;
const keccak256 = require('./sha3').keccak256;
const hash = require('./hashes.js');
const nacl = require('./nacl.min.js');
const crypto = require('crypto');

const NetType = {
    'Public_Net': 1,
    'Test_Net': 2,
    'RegTest_Net': 3
};

class AccountHandle {
    constructor() {}

    createAccount (net) {
        let keyPair = this.createkeyPair(net);
        let s2 = this.pubKeyToaddress(keyPair.publicKey);
        return {
            'secretKey': keyPair.secretKey,
            'publicKey': keyPair.publicKey,
            'addr': s2
        }
    }

    createAccountWithPubKey (pubKey, netType = NetType.Public_Net) {
        let s1 = keccak512(pubKey);

        let s2 = new hash.RMD160({'utf8':false}).hex(this.Hex2Str(s1));
        let s3 = '00' + s2;
        if(netType == NetType.Test_Net) {
            s3 = 'S'.charCodeAt() + s2;
        }
        
        let v = keccak512(this.Hex2Array(s3)).substring(0, 8);
        let s4 = s3 + v;

        let addr = new bs58().encode(this.Hex2Array(s4));
        return {
            'secretKey': keyPair.secretKey,
            'publicKey': keyPair.publicKey,
            'addr': addr
        }
    }

    createKeyPair() {
        return new nacl.sign.keyPair();
    }

    //创建密钥对
    createKeyPairBySecretKey(secretKey) {
        return new nacl.sign.keyPair.fromSeed(secretKey);
    }

    //创建密钥
    createSecretKey() {
        let secretKey;
        do {
            secretKey = crypto.randomBytes(32);
        }
        while(!this.verifyKey(secretKey));
        return secretKey;
    }

    //密钥验证
    verifyKey (secretKey) {
        if(secretKey.length != 32) return false;
        for (let i=0; i<32; i++) {
            if(typeof secretKey[i] !== 'number') return false;
            if(secretKey[i] > 0xff) return false;
        }
        const MaxVal = Buffer.from('1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ec', 'hex');
        for(let i=0; i<MaxVal.length; i++) {
            if(MaxVal[i] < secretKey[i]) {
                return false;
            }
            else if (MaxVal[i] > secretKey[i]) {
                return true;
            }
        }
        return true;
    }

    Hex2Str(hex) {
        // let ret = '';
        // for(let i=0; i<hex.length; i+=2) {
        //     ret += String.fromCharCode(parseInt(hex.substr(i,2), 16));
        // }
        // return ret;

        const obj = Buffer.from(hex, 'hex');
        return obj.toString('latin1');
    }

    Hex2Array(hex) {
        // let ret = new Array();
        // for(let i=0; i<hex.length; i+=2) {
        //     ret.push(parseInt(hex.substr(i,2), 16));
        // }
        // return ret;
        return Buffer.from(hex, 'hex');
    }

    createkeyPair(){
        const secretKey = this.createSecretKey();
        let keyPair = this.createKeyPairBySecretKey(secretKey);
        return keyPair;
    }
    pubKeyToaddress(publicKey){
        let s1 = keccak256(publicKey);
        let checkAddress = s1.toLowerCase().substring(19,s1.length-1).split("");
        let hashAddress = keccak256(checkAddress);
        var address="";
        for(var i=0;i<checkAddress.length;i++){
            if(isNaN(checkAddress[i])){
                if(parseInt(checkAddress[i],16)-parseInt(hashAddress[i],16)>parseInt("0x8",16)){
                    address=address+checkAddress[i].toUpperCase();
                }else{
                    address=address+checkAddress[i];
                  }
            }else{
                address=address+checkAddress[i];
            }
        }
        let   s2="WX"+address;//测试链WS，实际WX
        //let s2 = new hash.RMD160({'utf8':false}).hex(this.Hex2Str(s1));
        //let s3 = '00' + s2;
        // if(netType == NetType.Test_Net) {
        //     s3 = 'S'.charCodeAt() + s2;
        // }
        // let v = keccak512(this.Hex2Array(s3)).substring(0, 8);
        // let s4 = s3 + v;
        // let addr = new bs58().encode(this.Hex2Array(s4));
        return s2;
    }

    
}

module.exports = AccountHandle;