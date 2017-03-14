module.exports = function(RED) {
    function XivelyConfigNode(config) {
        RED.nodes.createNode(this,config);
        this.apikey = config.apikey;
        this.feedid = config.feedid;
    }
    RED.nodes.registerType("xively-config",XivelyConfigNode);
}
