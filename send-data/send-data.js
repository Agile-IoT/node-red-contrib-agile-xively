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

      else if (fs.existsSync(WORK_DIR+"/xivelycredentials.txt"))
      {
        d('Reading the API Key and the Feed ID from the locally stored file')
        fs.readFile(WORK_DIR+"/xivelycredentials.txt", (err, data) => {
        if (err) throw err;
        else {
            var credentials = JSON.parse(data)
            d('Read the contents from the file'+data)
            pushData(node,credentials.apikey,credentials.feed_id)
        }
        });
      }


      // else if((node.context().global.get(xivelyapikey))&&(node.context().global.get(xivelyfeedid)))
      // {
      //     d('Using the settings from the global configuration')
      //     pushData(node,node.context().global.get(xivelyapikey),node.context().global.get(xivelyapikey));
      // }

      else {
        d("Node conifguration not found")
        preRegister(node);
      }



    }

    var preRegister = function(node){
        var globalContext = node.context().global;
        if((globalContext.get('xivelymaster')!==undefined)&&(globalContext.get('xivelyproduct')!==undefined)&&(globalContext.get('xivelyserial')!==undefined))
        {
          var preRegistrationUrl='http://api.xively.com/v2/products/'+globalContext.get('xivelyproduct')+'/devices';
          var preRegistrationBody='{"devices": [{"serial": "'+globalContext.get('xivelyserial')+'"}]}';
          var options = {
          url: preRegistrationUrl,
          method: 'POST',
          headers: {
            'User-Agent': 'request',
            'X-ApiKey':globalContext.get('xivelymaster'),
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
            activateDevice(node);
          }
        }
        })

        }
      }

      var activateDevice = function(node) {
          var globalContext = node.context().global;
          if(globalContext.get('xivelysecret')!==undefined)
          {
              var activationKey = crypto.createHmac('sha1', new Buffer(globalContext.get('xivelysecret'),'hex')).update(globalContext.get('xivelyserial'),'utf8').digest('hex');
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
                    var credentials = JSON.parse(res.body)
                    d("Device was activated with key = "+credentials.apikey+" and feedid = "+credentials.feed_id);
                    fs.writeFile(WORK_DIR+"/xivelycredentials.txt", res.body, (err) => {
                      if (err) throw err;
                      else d('Written new credentials to file');
                    });
                    pushData(node,credentials.apikey,credentials.feed_id)
                }

                else if (res.statusCode===403)
                {
                    d("Device already activated")
                    node.warn("Device was already registered")
                }
              }
              })
          }
      }

      var pushData = function (node,apikey,feedid){

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
      RED.nodes.registerType("send-data",sendData);
    }
