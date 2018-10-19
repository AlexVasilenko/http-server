'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stream = require('stream');

class HttpRequest extends _stream.Readable {
  constructor(socket) {
    super();
    this.socket = socket;
    this.headers = null;
    this.method = null;
    this.url = null;
    this._timeoutOnMaxHeadersRecievingTime;
    this._maxHeadersRecievingTime = 30000;
    this._onData();
  }

  _read() {
    this.socket.resume();
  }

  _processHeaders(buffer) {
    const headersArray = buffer.toString().split('\r\n');
    const httpTypeString = headersArray.splice(0, 1).toString();

    this.headers = this._parseHeaders(headersArray);
    this.method = this._getMetod(httpTypeString);
    this.url = this._getUrl(httpTypeString);
  }

  _parseHeaders(headersArray) {

    return headersArray.map(data => {
      const dataArr = data.split(': ');
      const response = {};
      const key = dataArr.shift().toLowerCase();
      const value = dataArr.join(': ');
      response[key] = value;
      return response;
    }).reduce((result, item) => {
      const key = Object.keys(item)[0];
      const obj = result;
      obj[key] = item[key];
      return obj;
    }, {});
  }

  _getMetod(httpTypeString) {
    return httpTypeString.split(' ')[0];
  }

  _getUrl(httpTypeString) {
    return httpTypeString.split(' ')[1].split(' ')[0];
  }

  _onData() {
    let buffer = Buffer.alloc(0);

    if (!this._timeoutOnMaxHeadersRecievingTime) {
      this._timeoutOnMaxHeadersRecievingTime = setTimeout(() => {
        this.socket.emit('error', new Error('HTTP 408 Request Timeout'));
      }, this._maxHeadersRecievingTime);
    }

    this.socket.on('data', data => {
      if (!this.headers) {
        buffer = Buffer.concat([buffer, data]);
        const indexOfHeadersEnd = buffer.indexOf('\r\n\r\n');
        const isHeadersRecieved = indexOfHeadersEnd !== -1;

        if (!isHeadersRecieved) {
          return;
        }

        const headersBuffer = buffer.slice(0, indexOfHeadersEnd);
        const devider = 4;
        const bodyBuffer = buffer.slice(indexOfHeadersEnd + devider);

        this._processHeaders(headersBuffer);

        if (bodyBuffer.length) {
          this.socket.unshift(bodyBuffer);
        }

        // clearTimeout(this._timeoutOnMaxHeadersRecievingTime);
        this.emit('headers');
      } else {
        this.push(data);
        this.socket.pause();
      }
    });

    // socket on data not ever empty, so we have to close the request stream on socket 'end' event
    // event is emitted when the other end of the socket sends a FIN packet
    this.socket.on('end', () => {
      this.push(null);
      clearTimeout(this._timeoutOnMaxHeadersRecievingTime);
    });

    this.socket.on('close', () => {
      this.emit('close');
      clearTimeout(this._timeoutOnMaxHeadersRecievingTime);
    });
  }

  end() {
    this.push(null);
  }
}

exports.default = HttpRequest;
//# sourceMappingURL=request.js.map