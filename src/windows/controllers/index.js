"use strict";

const path = require('path');
const { BrowserWindow,dialog} = require('electron');
const remote = require('electron');
var Menu = remote.Menu;
const clidwindow=require('./clidwindow');
const clidw=new clidwindow();
const zh = require('../lang/zh');
const en = require('../lang/en');
const { app } = require('electron');
const electron = require('electron');
const globalShortcut = electron.globalShortcut;
const ipc = require('electron').ipcMain; 
const os = require("os")
const fs = require('fs');
const KeyStore = require('keystore_wdc');
const keystore = new KeyStore();
const KeyStoreController = require('../lib/keystore-controller');
const keyStoreController = new KeyStoreController();
KeyStoreController


//node 配置
let ip;
var systemType=os.type();
let node_path;
if(systemType == "Darwin"){
  node_path = path.join(os.homedir(),'/Library/Wisdom');
}else{
  let dir = __dirname.substring(0,__dirname.length-24);
  node_path = path.join(dir,'/Wisdom');
}
const filePath = path.join(node_path,'/'+ "node");
if(!fs.existsSync(filePath)){
  keyStoreController.ModifyNode("http://192.168.1.11:19585");
  ip = "http://192.168.1.11:19585";
}else{
  ip = keyStoreController.NodeInfo(); 
}





// const Il8nindex=require('../i18n/Il8nindex');
// new Il8nindex();
//const AppConfig = require('../../configuration');

//const lan = AppConfig.readSettings('language');

//const Common = require('../../common');


global.network = {
  someProperty: "main"
};

global.sharedObject = {
  __dirname: __dirname
};

global.ipObject = {
  _ip: ip
};

ipc.on("changeNode",function(event,data){
  global.ipObject = {
    _ip:"http://"+data
  };
})

ipc.on("hereyoua",function(event,data){
  top.loadURL(`file://${path.join(__dirname, '/../views/account.html')}`);
  })

ipc.on("send",function(event,data){
  top.loadURL(`file://${path.join(__dirname, '/../views/account.html')}`);
  })



app.on('window-all-closed', () => {
  app.quit()
})


var s1;
var s2;
var s3;
var s4;
var s5;
var s6;
var s7;
var s8;
var s9;
var s10;
var s11;
var s12;
var s13;

let checka = true;
let checkb = false;
let top;

class Index {

  constructor() {
    top = new BrowserWindow({
      width: 800,
      height: 580,
      title: 'Wisdom Wallet',
      resizable: true,
      center: true,
      show: false,
      frame: true,
      autoHideMenuBar: false,
      alwaysOnTop: false,
      icon: 'assets/icon.jpg',
      titleBarStyle: 'hidden',
    });

    top.loadURL(`file://${path.join(__dirname, '/../views/account.html')}`);
    // top.isShown = false;

    var menu = Menu.buildFromTemplate(this.menuindex());
    Menu.setApplicationMenu(menu);
  }

  show() {
    top.show();
    top.isShown = true;

    // 打开开发者工具
    top.webContents.openDevTools()
  }

  hide() {
    // top.hide();
    // top.isShown = false;
  }

  // close() {
  //   app.quit();
  //   // top.close();
  // }


  //菜单初始化
  menuindex(type){


    if(type==null||type=='zh'){//默认中文
      s1=zh.account;
      s2=zh.exprotkeystore;
      s3=zh.export;
      s4=zh.saveas;
      s5=zh.qrcode;
      s6=zh.view;
      s7=zh.language;
      s8=zh.mapping;
      s9=zh.register;
      s10=zh.network;
      s11=zh.mainNetwork;
      s12=zh.testNetwork;
      s13=zh.addAccount;
    }else if(type=='en'){
      s1=en.account;
      s2=en.exprotkeystore;
      s3=en.export;
      s4=en.saveas;
      s5=en.qrcode;
      s6=en.view;
      s7=en.language;
      s8=en.mapping;
      s9=en.register;
      s10=en.network;
      s11=en.mainNetwork;
      s12=en.testNetwork;
      s13=en.addAccount;
    }

    if(type == 1){
      checka = true;
      checkb = false;
    }else if(type == 2){
      checka = false;
      checkb = true;
    }


    var template = [{
      label: s1,
      submenu: [{
        type: 'separator'   //分割符
      },{
        label: s2, //this.$t('exprotkeystore')
        // accelerator: 'Ctrl+Z',
        role: 'export',
        submenu:[{
          label: s3,
          click:function(){
            dialog.showOpenDialog(null,{
              properties: ['openFile', 'showHiddenFiles'],
              filters: [{
                name: 'Text', 
              }]
            },function(files){
              if(files!=null){
                let pathss=files[0];
                clidw.clidwindow(pathss,'1');
              }
            })
          }
        }
        // ,{
        //   label: s4,
        //    click:function(){
        //     dialog.showOpenDialog(null,{
        //       properties: ['openFile', 'showHiddenFiles'],
        //       filters: [{
        //         name: 'Text', 
        //       }]
        //     },function(files){
        //       if(files!=null){
        //         let pathss=files[0];
        //         clidw.clidwindow(top,pathss,'2');
        //       }
        //     })
        //   }
        // }
      ]
      }, 
      // {
      //   label: s5,
      //   accelerator:'Ctrl+Z',
      //   click:function(){
      //     dialog.showOpenDialog(null,{
      //       properties: ['openFile', 'showHiddenFiles'],
      //       filters: [{
      //         name: 'Text', 
      //       }]
      //     },function(files){
      //       if(files!=null){
      //         let pathss=files[0];
    
      //         clidw.qrcode(top,pathss);
      //       }
      //     })
      //   }
      // }, 
      {
        label: s13,
        click: function(){
          //clidw.addAccount(top,__dirname);
          clidw.addAccount();
        }
      }]
    },
    // {
    //   label: s8,
    //   submenu: [{
    //     label: s9,
      
    //       click: function(){
    //         clidw.mapping();
    //       }
      
    //   }]
    // },
    {
       label: "Edit",
       submenu: [
          { label: "Undo", accelerator: "CommandOrControl+Z", selector: "undo:" },
          { label: "Redo", accelerator: "Shift+CommandOrControl+Z", selector: "redo:" },
          { type: "separator" },
          { label: "Cut", accelerator: "CommandOrControl+X", selector: "cut:" },
          { label: "Copy", accelerator: "Ctrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CommandOrControl+V", selector: "paste:" },
          { label: "Select All", accelerator: "CommandOrControl+A", selector: "selectAll:" }
      ]}
  ];

    
    return template;
  }

}

module.exports = Index;