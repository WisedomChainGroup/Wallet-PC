"use strict";

var qr = require('qr-image')
var app = require('express')


class qrcode{
  
    qrcode(){

    }

}
app.get('/qrcode',function(req,res){
  var text=req.query.text;
  var code = qr.image(text,{type:'png'})
  res.sendFile(__dirname+'../views/qrcode.html')
  code.pipe(res);
})