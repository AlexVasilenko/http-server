'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _response = require('./response');

var _response2 = _interopRequireDefault(_response);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class HttpServer extends _events2.default {

  constructor(props) {
    super(props);
    this.server = _net2.default.createServer();

    this.server.on('connection', socket => {
      const req = new _request2.default(socket);
      const res = new _response2.default(socket);

      req.on('headers', () => {
        this.emit('request', req, res);
      });

      socket.on('error', error => {
        this.emit('error', error);
      });
    });
  }

  static createServer() {
    return new HttpServer();
  }

  listen(port) {
    this.server.listen(port);
  }
}

exports.default = HttpServer;
//# sourceMappingURL=http.js.map