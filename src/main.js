"use strict";

const {app, ipcMain,dialog} = require('electron');

const SplashWindow = require('./windows/controllers/splash');
const SettingWindow = require('./windows/controllers/settings');
const IndexWindow = require('./windows/controllers/index');
const SqliteHandle = require('./windows/lib/sqlite-handle');
const IpcMainHandle = require('./windows/lib/ipcmain-handle');
const nacl = require('./windows/lib/nacl.min.js');
//const AccountHandle = require('./windows/lib/account-handle');
const KeyStore = require('./windows/lib/keystore');
// require('../test/GetMaxNum');




class Main{
    constructor() {
        this.splashWindow = null;
        this.settingsWindow = null;
        this.indexWindow = null;
    }

    async init() {
        new IpcMainHandle().init();
        new SqliteHandle().init();
        this.initApp(); 
        this.initEvent();
        //this.test();
        //let keyStore = new AccountHandle().CreateKeyStore();
        // const keystore = new KeyStore();
        // //创建keystore
        // const savefile = await keystore.Create('123456');
        // //保存keystore
        // keystore.Save(savefile);
        //根据keystore和密码返回私钥
        //await keystore.DecryptSecretKey('WXSc6cc0fc724c44276beb642@1545967555087', '123456');
        //校验地址
        //Verification.AddressVerify('WSc6cc0fc724c44276beb642');
    }

    initEvent() {
        //账户另存为
        ipcMain.on('save-dialog', (event) => {
            const options = {
                title: '保存文本',
                filters: [
                  { name: 'Custom File Type', extensions: ['text'] }
                ]
            }
            dialog.showSaveDialog(options, (filename) => {
              event.sender.send('saved-file', filename)
            })
        })

                // ipcMain.on('test_dirname', (event) => {
        //     var path=(__dirname);
        //     console.log(path);
        //     event.sender.send('get_dirname', path)
        // })
    }

    initApp() {
        app.on('ready', ()=> {
            this.createSplashWindow();
            this.createIndexWindow();
            //dialog.showErrorBox("提示","你出现错误拉");
            setTimeout(function(obj) {
                obj.splashWindow.close();
                obj.indexWindow.show();
            }, 2000, this);
        });

        app.on('activate', () => {
        });
    };

    createSplashWindow() {
        this.splashWindow = new SplashWindow();
        this.splashWindow.show();
    }

    createSettingsWindow() {
        this.settingsWindow = new SettingWindow();
    }

    createIndexWindow() {
        this.indexWindow = new IndexWindow();
    }

}

new Main().init();