const bs58 = require('./base58');
const keccak512 = require('./sha3').keccak512;

class Verification {
    //密钥校验
    static SecretKeyVerify (key) {
        if (key.length == undefined) return false;
        if (key.length != 32) return false;
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

    //公钥校验
    static PublicKeyVerify (key) {
        if (key.length == undefined) return false;
        if (key.length != 32) return false;
        for (let i=0; i<32; i++) {
            if(typeof secretKey[i] !== 'number') return false;
            if(secretKey[i] > 0xff) return false;
        }

        return true;
    }

    //地址校验
    static AddressVerify (addr) {
        //地址不一样了，这边都要修改
        if (addr.length == undefined || addr.length!=25) return false;
        //base58添加了0
        const BASE58 = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        for (let i=0; i<addr.length; i++) {
            if (BASE58.indexOf(addr[i]) == -1) return false;
        }

        //地址前缀
        let s=addr.substring(0,3);
        if(s!="WXS" && s!="WXC" ) return false;

        /* const addr_decode = new bs58().decode(addr);
        let s4 = addr_decode.toString('hex');
        let s3 = s4.substring(0, s4.length-8);
        let v = s4.substring(s4.length-8);
        let s3_buffer = Buffer.from(s3, 'hex');
        let v1 = keccak512(s3_buffer).substring(0, 8);
        
        if (v != v1) return false;
        if (s3_buffer[0] != 0x00 &&  s3_buffer[0] != 0x53) return false; */

        return true;
    }
}

module.exports = Verification;