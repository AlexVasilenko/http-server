'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stream = require('stream');

class HttpResponse extends _stream.Writable {
  constructor(socket) {
    super();
    this.socket = socket;
    this._headers = {};
    this._isHeaderSent = false;
    this._statusCode = 200;
  }

  _write(chunk, enc, next) {
    if (!this._isHeaderSent) {
      this._headers = this._prepareHeaders(this._headers, this._statusCode);
      this._isHeaderSent = true;
      this.socket.write(this._headers);
      console.log('1');
    }

    this.socket.write(chunk);
    this.socket.end();
    next();
  }

  _normilizeHeaders(obj) {
    const normilizedHeaders = {};

    Object.keys(obj).forEach(key => {
      const k = key.toLowerCase();
      const value = typeof obj[key] === 'string' ? obj[key].toLowerCase() : obj[key];
      normilizedHeaders[k] = value;
    });

    return normilizedHeaders;
  }

  _prepareHeaders(obj, status) {
    const arr = Object.keys(obj).map(key => `${key}: ${obj[key]}`);
    arr.splice(0, 0, `HTTP/1.1 ${status}`);
    const headers = `${arr.join('\r\n')}\r\n\r\n`;
    return headers;
  }

  setHeader(headerName, value) {
    if (this._isHeaderSent) {
      this.emit('error', new Error('headers are already sent'));
    }

    const headerNameLowerCase = headerName.toLowerCase();
    this._headers[headerNameLowerCase] = value;
  }

  writeHead(statusCode, headers) {
    if (this._isHeaderSent) {
      this.emit('error', new Error('headers are already sent'));
    }

    if (typeof statusCode !== 'number') {
      this.emit('error', new Error('status code is not valid'));
    }

    if (headers) {
      const normilizedHeaders = this._normilizeHeaders(headers);
      this._headers = Object.assign(this._headers, normilizedHeaders);
    }

    this._statusCode = statusCode;
    this._headers = this._prepareHeaders(this._headers, this._statusCode);
    this._isHeaderSent = true;
    this.socket.write(this._headers);
  }
}

exports.default = HttpResponse;
//# sourceMappingURL=response.js.map