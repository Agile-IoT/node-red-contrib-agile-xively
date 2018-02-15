/*******************************************************************************
 *Copyright (C) 2017 FBK.
 *All rights reserved. This program and the accompanying materials
 *are made available under the terms of the Eclipse Public License v1.0
 *which accompanies this distribution, and is available at
 *http://www.eclipse.org/legal/epl-v10.html
 *
 *Contributors:
 *    FBK - initial API and implementation
 ******************************************************************************/
var crypto = require('crypto')
var fs = require('fs')
let WORK_DIR = '/opt'
module.exports = function(RED) {
    //use this module to make requests
    var d = require('debug')('xively')
    var request=require('request');

    //function to send data to Xively
    function sendData(config) {
      RED.nodes.createNode(this,config);
      var node = this;
      node.variable=config.variable;
      node.serial=config.serial;
      node.status();
      //Get the configuration node
      node.server = RED.nodes.getNode(config.server);
      //If the configuration node exists, get the configuration from the node
      if(node.server){
        d('Using the settings from the Xively config node')
        node.apikey=node.server.apikey;
        node.feedid=node.server.feedid;
        pushData(node,node.apikey,node.feedid);
      }

      else
      {
        node.once('input', function(msg){
            if((msg.credentials.xively.apikey)&&(msg.credentials.xively.feedid))
            {
              d('Reading the API Key and the Feed ID from the msg object')
              pushData(node,msg.credentials.xively.apikey,msg.credentials.xively.feedid);
            }
            else if((msg.credentials.xively.xivelymaster)&&(msg.credentials.xively.xivelyproduct)&&(msg.credentials.xively.xivelysecret))
            {
              d('Pre-registering the device')
              preRegister(node,msg)
            }
        })



      }

    }

    var preRegister = function(node,msg){

      var preRegistrationUrl='http://api.xively.com/v2/products/'+msg.credentials.xively.xivelyproduct+'/devices';
      d(preRegistrationUrl)
      var preRegistrationBody='{"devices": [{"serial": "'+node.serial+'"}]}';
      d(preRegistrationBody)
      var options = {
      url: preRegistrationUrl,
      method: 'POST',
      headers: {
        'User-Agent': 'request',
        'X-ApiKey':msg.credentials.xively.xivelymaster,
        'Content-Type':'application/json'
      },
      body: preRegistrationBody
    };



    request(options,function(err,res,body){
    if(err)
    {
      node.warn("Error in preRegistration",err);
    }
    else
    {
      d(res.statusCode+' '+res.body);
      if(res.statusCode===201)
      {
        d("Device was pre-registered")
        activateDevice(node,msg);
      }

      else if (res.statusCode===401)
      {
        d("Credentials are not sufficient to perform operation");
        node.warn("Credentials are not sufficient to perform operation");
        node.status({fill:"red", shape:"ring", text:"Insufficient credentials"});
      }
    }
    })

  }

  var activateDevice = function(node,msg) {
          var activationKey = crypto.createHmac('sha1', new Buffer(msg.credentials.xively.xivelysecret,'hex')).update(node.serial,'utf8').digest('hex');
          var activationUrl='http://api.xively.com/v2/devices/'+activationKey+'/activate'
          var options = {
          url: activationUrl,
          method: 'GET',
          headers: {
            'User-Agent': 'request',
            'Content-Type':'application/json'
          },
          body: null
        };



          request(options,function(err,res,body){
          if(err)
          {
            node.warn("Error in activation",err);
          }
          else
          {
            if(res.statusCode===200)
            {
                var credentials = JSON.parse(res.body);
                pushData(node,credentials.apikey,credentials.feed_id);
                storeCredentials(node, msg, credentials);
                node.status({fill:"green", shape:"ring", text:"Device activated"});
            }

            else if (res.statusCode===403)
            {
                d("Device already activated")
                node.warn("Device was already activated")
                node.status({fill:"yellow", shape:"ring", text:"Device already activated"});
            }
          }
          })

  }
      var pushData = function (node,apikey,feedid){
          d('PushData called with '+apikey+' '+feedid);
          var url='http://api.xively.com/v2/feeds/'+feedid+'.json'
          //event handler for receipt of a new message from the Read node
          node.on('input', function(msg) {

          //Checking the input message for requiredProperties

          //Extract the keys in the input message payload
          var msgKeys=Object.keys(JSON.parse(msg.payload));

          //requiredProperties for the incoming message
          var requiredProperties=['value','deviceID','componentID','lastUpdate'];
          var missingProperties=[];

          //check for all requiredProperties
          for (var index in requiredProperties)
          {
          if(msgKeys.indexOf(requiredProperties[index])===-1)
            missingProperties.push(requiredProperties[index]);
          }

          //if all the properties are not present throw warning
          if (missingProperties.length!=0)
          {
            node.status({fill:"red",shape:"ring",text:"Missing parameters"});
            RED.log.warn('Missing property in send-data node input: '+missingProperties);
            return;
          }

          //If all properties are present change status of node to sending
          node.status({fill:"blue",shape:"ring",text:"sending"});

          //Convert the timestamp from Epoch to ISO8601 format specified by Xively
          var timestamp = new Date(JSON.parse(msg.payload).lastUpdate);

          d('Trying to send value '+JSON.parse(msg.payload).value+' with timestamp '+timestamp+' of type '+JSON.parse(msg.payload).componentID+' to variable'+node.variable)

          //Create message body by including the value from the sensor and the timestamp of the data
          var bodyString='{"version":"1.0.0","datastreams" : [ {"id" : "'+node.variable+'","datapoints":[{"at":"'+timestamp+'","value":"'+JSON.parse(msg.payload).value+'"}]}]}'

          //Inside options for body only Strings are accepted, JSON objects are not accepted, thus the request is created as a String above
          //Options are used to set the URL, the method for the message and the security for the header
          var options = {
          url: url,
          method: 'PUT',
          headers: {
            'User-Agent': 'request',
            'X-ApiKey':apikey,
            'Content-Type':'application/json'
          },
          body: bodyString
        };



          request(options,function(err,res,body){
          if(err)
          {
            node.status({fill:"red",shape:"ring",text:"disconnected"});
            //node.warn("Error in sending the data",err);
          }
          else
          {
            console.log(res.statusCode+' '+res.body);
            if(res.statusCode===200)
            {
              msg.payload='The value '+JSON.parse(msg.payload).value+' was added to channel: '+node.variable;
              node.status({fill:"green",shape:"dot",text:"sent"});
            }
            if(res.statusCode===403)
            {
            msg.payload='Error code is '+res.statusCode+': '+JSON.parse(res.body).title
            node.status({fill:"yellow", shape:"ring", text:"Unaccepted Rate"});
            }
    //      msg.payload=(res.statusCode===200)?'Successfully added value '+JSON.parse(msg.payload).value+' to feed':'Error with code '+res.statusCode;
            node.send(msg);
          }
          })
          });


      }

      var storeCredentials = function(node, msg,credentials){
        //Get the name of the host and store it in hostname
        var fs = require('fs');
        var hostname = fs.readFileSync('/etc/hostname');
        hostname = hostname.toString().trim();

        //check if AGILE_HOST is defined, then use it, else use the hostname in the URLs
        if(process.env.AGILE_HOST){
          var api = "http://"+process.env.AGILE_HOST+":8000";
          var idmurl = "http://"+process.env.AGILE_HOST+":3000";
        } else if(hostname){
          var api = "http://"+hostname+".local:8000";
          var idmurl = "http://"+hostname+".local:3000";
        }
        var token = msg.token;
        var agile = require('agile-sdk')({
        api: api,
        idm: idmurl,
        token: token
      });



      try
      {
      agile.idm.entity.setAttribute({
          entityId: msg.userInfo.id,
          entityType: 'user',
          attributeType: 'credentials',
          attributeValue: {'xively':{'xivelymaster':msg.credentials.xively.xivelymaster, 'xivelyproduct':msg.credentials.xively.xivelyproduct, 'xivelysecret':msg.credentials.xively.xivelysecret,'apikey':credentials.apikey,'feedid':credentials.feed_id}}

      }).then(function(data) {
       d("Stored credentials: "+JSON.stringify(data));
      }).catch(function(err) {
      d("Failed to store credentials ", err)
      });
      }

      catch(err)
      {
        node.error(err);
      }

      }
      RED.nodes.registerType("xively-send-data",sendData);
    }
