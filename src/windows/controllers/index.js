"use strict";

const path = require('path');
const { BrowserWindow,dialog} = require('electron');
var remote = require('electron');
var Menu = remote.Menu;
const clidwindow=require('./clidwindow');
const clidw=new clidwindow();
const zh = require('../lang/zh');
const en = require('../lang/en');

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


const ipc = require('electron').ipcMain; 

ipc.on("hereyoua",function(event,data){
  top.loadURL(`file://${path.join(__dirname, '/../views/index.html')}`);
  })

//   ipc.on("close", (e) => {
    
//     // app.quit();
//     app.once('window-all-closed', app.quit)

// });

 


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
      height: 600,
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

    top.loadURL(`file://${path.join(__dirname, '/../views/index.html')}`);
    // top.isShown = false;

    

    var menu = Menu.buildFromTemplate(this.menuindex());
    Menu.setApplicationMenu(menu);

   

  }

  show() {
    top.show();
    top.isShown = true;

    // 打开开发者工具
    //top.webContents.openDevTools()
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
    
                clidw.clidwindow(top,pathss,'1');
              }
            })
          }
        },{
          label: s4,
           click:function(){
            dialog.showOpenDialog(null,{
              properties: ['openFile', 'showHiddenFiles'],
              filters: [{
                name: 'Text', 
              }]
            },function(files){
              if(files!=null){
                let pathss=files[0];
                clidw.clidwindow(top,pathss,'2');
              }
            })
          }
        }]
      }, {
        label: s5,
        accelerator:'Ctrl+Z',
        click:function(){
          dialog.showOpenDialog(null,{
            properties: ['openFile', 'showHiddenFiles'],
            filters: [{
              name: 'Text', 
            }]
          },function(files){
            if(files!=null){
              let pathss=files[0];
    
              clidw.qrcode(top,pathss);
            }
          })
        }
      }, {
        label: s13,
        click: function(){
          clidw.addAccount(top,__dirname);
        }
      }]
    },{
      label: s8,
      submenu: [{
        label: s9,
      
          click: function(){
            clidw.mapping();
          }
      
      }]
    },{
      label: s10,
      submenu: [{
        label: s11, type: 'checkbox',id:'check1',checked: checka,
          click: function(){
            global.network.someProperty="main"
            const options = {
              title: '提示',
              message: "已切换到主网！",
              buttons: ['是']
            }
            remote.dialog.showMessageBox(options);
            var menu = Menu.buildFromTemplate(new Index().menuindex(1));
            Menu.setApplicationMenu(menu);
          }
      
      },{
        label: s12, type: 'checkbox',checked: checkb,
          click: function(){
            global.network.someProperty="test"
            const options = {
              title: '提示',
              message: "已切换到测试网！",
              buttons: ['是']
            }
            remote.dialog.showMessageBox(options);
            var menu = Menu.buildFromTemplate(new Index().menuindex(2));
            Menu.setApplicationMenu(menu);
          }
      
      }]
    },{
      label: s6,
      submenu: [{
        label: s7,
        submenu: [{
          label: '中文',
          click: function(){
            var menu = Menu.buildFromTemplate(new Index().menuindex('zh'));
            Menu.setApplicationMenu(menu);
          }
        },{
          label: 'English',
          click: function(){
            var menu = Menu.buildFromTemplate(new Index().menuindex('en'));
            Menu.setApplicationMenu(menu);
          }
        }]
      }]
    }];

    
    return template;
  }

}

module.exports = Index;