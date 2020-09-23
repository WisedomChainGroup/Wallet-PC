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

class KeyStoreController {
    constructor() {
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

    Hex2Array(hex) {
        return Buffer.from(hex, 'hex');
    }
}

module.exports = KeyStoreController;