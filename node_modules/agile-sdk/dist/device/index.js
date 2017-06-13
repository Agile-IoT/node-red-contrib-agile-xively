'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var WS = require('websocket').w3cwebsocket;

var device = function device(base, wsBase) {
  base = base + '/device';
  wsBase = wsBase + '/device';
  return {
    /**
    * @summary Get the device status
    * @name status
    * @public
    * @function
    * @memberof agile.device
    * @param {String} deviceId - Agile device Id
    * @fulfil {String} - status
    * @returns {Promise}
    * @example
    * agile.device.status('bleB0B448BE5084').then(function(status) {
    *  console.log(status);
    * });
    **/
    status: function status(deviceId) {
      return (0, _axios2.default)({
        method: 'GET',
        url: base + '/' + deviceId + '/status'
      }).then(function (res) {
        return res.data.status;
      }).catch(_utils.errorHandler);
    },
    /**
    * @summary Read values of all components from the device
    * @name get
    * @public
    * @function
    * @memberof agile.device
    * @param {String} deviceId - Agile device Id
    * @param {String} [componentId] - Agile component name, like a sensor
    * @fulfil {Object|Array} Single Component readings returned as object, Device readings returned as Array of Objects.
    * @returns {Promise}
    * @example
    * agile.device.get('bleB0B448BE5084').then(function(deviceComponents) {
    *   console.log(deviceComponents);
    * });
    * @example
    * agile.device.get('bleB0B448BE5084', 'Temperature').then(function(deviceComponent) {
    *   console.log(deviceComponent);
    * });
    **/
    get: function get(deviceId, componentId) {
      var url = base + '/' + deviceId;
      if (componentId) {
        url = base + '/' + deviceId + '/' + componentId;
      }
      return (0, _axios2.default)({
        method: 'GET',
        url: url
      }).then(function (res) {
        return res.data;
      }).catch(_utils.errorHandler);
    },
    /**
    * @summary Connect the device at protocol level
    * @name connect
    * @public
    * @function
    * @memberof agile.device
    * @param {String} deviceId - Agile device Id
    * @fulfil {Undefined}
    * @returns {Promise}
    * @example
    * agile.device.connect('bleB0B448BE5084').then(function() {
    *   console.log('Connected!');
    * });
    **/
    connect: function connect(deviceId) {
      return (0, _axios2.default)({
        method: 'POST',
        url: base + '/' + deviceId + '/connection'
      }).then(function (res) {
        return res.data;
      }).catch(_utils.errorHandler);
    },
    /**
    * @summary Disconnect device at protocol level
    * @name disconnect
    * @public
    * @function
    * @memberof agile.device
    * @param {String} deviceId - Agile device Id
    * @fulfil {Undefined}
    * @returns {Promise}
    * @example
    * agile.device.disconnect('bleB0B448BE5084').then(function() {
    *   console.log('Disconnected!');
    * });
    **/
    disconnect: function disconnect(deviceId) {
      return (0, _axios2.default)({
        method: 'DELETE',
        url: base + '/' + deviceId + '/connection'
      }).then(function (res) {
        return res.data;
      }).catch(_utils.errorHandler);
    },
    /**
    * @summary Perform an action on the device
    * @name execute
    * @public
    * @function
    * @memberof agile.device
    * @param {String} deviceId - Agile device Id
    * @param {String} command - Operation name to be performed
    * @fulfil {Undefined}
    * @returns {Promise}
    * @example
    * agile.device.execute('bleB0B448BE5084', command).then(function() {
    *   console.log(`executed ${command}!``);
    * });
    **/
    execute: function execute(deviceId, command) {
      return (0, _axios2.default)({
        method: 'GET',
        url: base + '/' + deviceId + '/execute/' + command
      }).then(function (res) {
        return res.data;
      }).catch(_utils.errorHandler);
    },
    /**
    * @summary Get the last record fetched from the device or component
    * @name lastUpdate
    * @public
    * @function
    * @memberof agile.device
    * @param {String} deviceId - Agile device Id
    * @param {String} [componentId] - Agile component name, like a sensor
    * @fulfil {Object|Array} Single Component readings returned as object, Device readings returned as Array of Objects.
    * @returns {Promise}
    * @example
    * agile.device.lastUpdate('bleB0B448BE5084', 'Temperature').then(function(temperatureReading) {
    *  console.log(temperatureReading);
    * });
     * @example
    * agile.device.lastUpdate('bleB0B448BE5084').then(function(componentsReading) {
    *  console.log(componentsReading);
    * });
    **/
    lastUpdate: function lastUpdate(deviceId, componentId) {
      var url = base + '/' + deviceId + '/lastUpdate';
      if (componentId) {
        url = base + '/' + deviceId + '/' + componentId + '/lastUpdate';
      }

      return (0, _axios2.default)({
        method: 'GET',
        url: url
      }).then(function (res) {
        return res.data;
      }).catch(_utils.errorHandler);
    },
    /**
    * @summary Enable a subscription to a data stream. Asynchronous data updates will be delivered via websocket.
    * @name subscribe
    * @public
    * @function
    * @memberof agile.device
    * @param {String} deviceId - Agile device Id
    * @param {String} componentId - Operation name to be performed
    * @fulfil {Object} - websocket instance - https://www.w3.org/TR/websockets/
    * @returns {Promise}
    * @example
    * agile.device.subscribe('bleB0B448BE5084', 'Temperature').then(function(stream) {
    *   stream.onerror = () => {
    *    console.log('Connection Error');
    *  };
    *
    *  stream.onopen = () => {
    *    console.log('WebSocket Client Connected');
    *  };
    *
    *  stream.onclose = () => {
    *    console.log('echo-protocol Client Closed');
    *  };
    *
    *  stream.onmessage = (e) => {
    *    if (typeof e.data === 'string') {
    *      console.log("Received: '" + e.data + "'");
    *    }
    *  };
    * });
    **/
    subscribe: function subscribe(deviceId, componentId) {
      return new Promise(function (resolve, reject) {
        resolve(new WS(wsBase + '/' + deviceId + '/' + componentId + '/subscribe'));
      });
    },
    /**
    * @summary Unsubscribe from a data stream
    * @name unsubscribe
    * @public
    * @function
    * @memberof agile.device
    * @param {String} deviceId - Agile device Id
    * @param {String} componentId - Agile component name, like a sensor
    * @fulfil {undefined}
    * @returns {Promise}
    * @example
    * agile.device.get('bleB0B448BE5084', 'Temperature').then(function() {
    *  console.log('Unsubscribed!');
    * });
    **/
    unsubscribe: function unsubscribe(deviceId, componentId) {
      return (0, _axios2.default)({
        method: 'DELETE',
        url: base + '/' + deviceId + '/' + componentId + '/subscribe'
      }).then(function (res) {
        return res.data;
      }).catch(_utils.errorHandler);
    }
  };
};

exports.default = device;