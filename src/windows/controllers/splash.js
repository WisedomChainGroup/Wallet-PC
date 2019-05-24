"use strict";

const path = require('path');
const { BrowserWindow } = require('electron');

//const AppConfig = require('../../configuration');

//const lan = AppConfig.readSettings('language');

//const Common = require('../../common');

class SplashWindow {
  constructor() {
    this.splashWindow = new BrowserWindow({
      width: 380,
      height: 120,
      title: 'Wise Wallet',
      resizable: false,
      center: true,
      show: true,
      frame: false,
      autoHideMenuBar: true,
      alwaysOnTop: true,
      icon: 'assets/icon.jpg',
      titleBarStyle: 'hidden',
    });

    this.splashWindow.loadURL(`file://${path.join(__dirname, '/../views/splash.html')}`);
    this.isShown = false;
  }

  show() {
    this.splashWindow.show();
    this.isShown = true;
  }

  hide() {
    this.splashWindow.hide();
    this.isShown = false;
  }

  close() {
      this.splashWindow.close();
  }
}

module.exports = SplashWindow;