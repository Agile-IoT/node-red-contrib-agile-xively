module.exports = function(RED) {
    //use this module to make requests
    var d = require('debug')('xively')
    var request=require('request');

    //function to send data to Xively
    function sendData(config) {
        RED.nodes.createNode(this,config);
        var node = this;

        //Create the URL from the data of the config nodes
        node.apikey=config.apikey;
        node.feedid=config.feedid;
        node.variable=config.variable;
        var url='https://api.xively.com/v2/feeds/'+node.feedid+'.json'
        this.on('input', function(msg) {
        node.status({fill:"blue",shape:"ring",text:"sending"});
        //Convert the timestamp from Epoch to ISO8601 format specified by Xively
        var timestamp = new Date(JSON.parse(msg.payload).lastUpdate);

        d('Trying to send value '+JSON.parse(msg.payload).value+' with timestamp '+timestamp+' of type '+JSON.parse(msg.payload).componentID)

        //Create message body by including the value from the sensor and the timestamp of the data
        var bodyString='{"version":"1.0.0","datastreams" : [ {"id" : "'+node.variable+'","datapoints":[{"at":"'+timestamp+'","value":"'+JSON.parse(msg.payload).value+'"}]}]}'

        //Inside options for body only Strings are accepted, JSON objects are not accepted, thus the request is created as a String above
        //Options are used to set the URL, the method for the message and the security for the header
        var options = {
        url: url,
        method: 'PUT',
        headers: {
          'User-Agent': 'request',
          'X-ApiKey':node.apikey,
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
