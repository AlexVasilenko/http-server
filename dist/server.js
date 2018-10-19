'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('mz/fs');

var _fs2 = _interopRequireDefault(_fs);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _http = require('./http');

var _http2 = _interopRequireDefault(_http);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PUBLICROOT = _config2.default.get('publicRoot');
const server = _http2.default.createServer();

server.on('request', (req, res) => {
  const contentType = _mime2.default.lookup(`${PUBLICROOT}/foo.html`);
  res.setHeader('Content-Type', contentType);

  _fs2.default.stat(`${PUBLICROOT}/foo.html`).then(stats => {
    res.setHeader('Content-Length', stats.size);
    res.writeHead(200);

    const stream = _fs2.default.createReadStream(`${PUBLICROOT}/foo.html`).pipe(res);

    stream.on('error', err => {
      console.error('The error raised was:', err);
    });
  }).catch(error => {
    console.error(error);
  });
}).on('error', error => {
  console.error(error);
});

exports.default = server;
//# sourceMappingURL=server.js.map