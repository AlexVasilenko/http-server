import test from 'ava';
import assert from 'assert';
import HttpRequest from '../src/http/request';
import HttpResponse from '../src/http/response';
import { Readable, Writable, Duplex } from 'stream';
import EventEmitter from 'events';
import sinon from 'sinon';
import Proxyquire from 'proxyquire';
import net from 'net';

const proxyquire = Proxyquire.noCallThru();
const pathToHttpModule = '../src/http/http';

/* Fake data */

const fakeHeaders = [
  'GET / HTTP/1.1',
  'Host: localhost:3000',
  'Cookie: mp_e5f9054305ad168448cfca228946c713_mixpanel=%7B%22distinct_id%22%3A%20%22159eb47ede21a9-06417fb276297a-1a441228-fa000-159eb47ede33ce%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; _ga=GA1.1.1329312924.1478369196; mp__mixpanel=%7B%22distinct_id%22%3A%20%221582fe175ad100-063b43c6aa438f-4b183205-fa000-1582fe175ae56d%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D',
  'Connection: keep-alive',
  'Upgrade-Insecure-Requests: 1',
  'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/602.4.8 (KHTML, like Gecko) Version/10.0.3 Safari/602.4.8',
  'Accept-Language: ru',
  'Cache-Control: max-age=0',
  'Accept-Encoding: gzip, deflate'
].join('\r\n') + '\r\n\r\n';

const fakeRequest = `${fakeHeaders}body`;

const expectedHeaders = {
  'host': 'localhost:3000',
  'cookie': 'mp_e5f9054305ad168448cfca228946c713_mixpanel=%7B%22distinct_id%22%3A%20%22159eb47ede21a9-06417fb276297a-1a441228-fa000-159eb47ede33ce%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; _ga=GA1.1.1329312924.1478369196; mp__mixpanel=%7B%22distinct_id%22%3A%20%221582fe175ad100-063b43c6aa438f-4b183205-fa000-1582fe175ae56d%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D',
  'connection': 'keep-alive',
  'upgrade-insecure-requests': '1',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/602.4.8 (KHTML, like Gecko) Version/10.0.3 Safari/602.4.8',
  'accept-language': 'ru',
  'cache-control': 'max-age=0',
  'accept-encoding': 'gzip, deflate'
};

const expectedMethod = 'GET';
const expectedPath = '/';
const expectedBody = 'body';

const fakeData = 'fake data';


/* Tests */

/* Request */

test.cb.skip('Request is ReadableStream and contain body without headers', t => {
  const fakeSocket = new Readable({ read: () => { } });
  const request = new HttpRequest(fakeSocket);
  let buffer = Buffer.alloc(0);

  t.true(request instanceof Readable);

  fakeSocket.push(fakeRequest);
  fakeSocket.push(null);

  request.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);
  }).on('end', () => {
    t.is(buffer.toString(), expectedBody);
    t.end();
  });
});
/*
test.cb('Request should support chunked headers', t => {
  const fakeSocket = new Readable({ read: () => { } });
  const request = new HttpRequest(fakeSocket);
  const fakeHeadersPart1 = fakeHeaders.substr(0, ~~(fakeHeaders.length / 2));
  const fakeHeadersPart2 = fakeHeaders.substr(fakeHeadersPart1.length);

  request.on('headers', () => {
    t.deepEqual(request.headers, expectedHeaders);
    t.pass();
    t.end();
  });

  fakeSocket.push(fakeHeadersPart1);
  fakeSocket.push(fakeHeadersPart2);
});

test.cb('Request parser should correctly parse headers, method & url fields', t => {
  const fakeSocket = new Readable({ read: () => { } });
  const request = new HttpRequest(fakeSocket);

  fakeSocket.push(fakeHeaders);

  request.on('headers', () => {
    t.deepEqual(request.headers, expectedHeaders)
    t.is(request.method, expectedMethod)
    t.is(request.url, expectedPath)
    t.end();
  });
});*/

/* Response */

//add check does socket has setHeader method ?
/*test.cb('Call to setHeader if headers have been already sent should emit error', t => {
  const fakeSocket = new Writable({ write: () => { } });
  const fakeReadable = new Readable({ read: () => { } });
  const response = new HttpResponse(fakeSocket);

  fakeReadable.push('123');
  fakeReadable.push(null);

  response.setHeader('Content-length', 100);

  const stream = fakeReadable.pipe(response);

  function setHeaderSecondary() {
    response.setHeader('Content-length', 1000);
  }

  stream.on('finish', () => {
    assert.throws(setHeaderSecondary, Error);
    t.end();
  })
});

test.cb('Call to writeHead after head was already written should emit error', t => {
  const fakeSocket = new Writable({ write: () => { } });
  const fakeReadable = new Readable({ read: () => { } });
  const response = new HttpResponse(fakeSocket);

  fakeReadable.push('123');
  fakeReadable.push(null);
  response.writeHead(200);

  const stream = fakeReadable.pipe(response);

  function setWriteHeadSecondary() {
    response.writeHead(300);
  }

  stream.on('finish', () => {
    assert.throws(setWriteHeadSecondary, Error);
    t.end();
  })
});

test.cb('All headers added with setHeader should be sent to socket', t => {
  const expectedHeaders = ['content-length: 100', 'content-type: text/html'].join('\r\n');
  let buffer = Buffer.alloc(0);

  const fakeSocket = new Writable({
    write: (chunk, enc, next) => {
      buffer = Buffer.concat([buffer, chunk]);
      next();
    }
  });

  const fakeReadable = new Readable({ read: () => { } });
  const response = new HttpResponse(fakeSocket);

  fakeReadable.push(fakeData);
  fakeReadable.push(null);

  response.setHeader('content-length', 100);
  response.setHeader('content-type', 'text/html');

  const stream = fakeReadable.pipe(response);

  stream.on('finish', () => {
    const indexOfHeadersEnd = buffer.indexOf('\r\n\r\n');
    const headersBuffer = buffer.slice(0, indexOfHeadersEnd);
    const headersArr = headersBuffer.toString().split('\r\n');
    headersArr.splice(0, 1);
    const headersString = headersArr.join('\r\n');

    t.is(headersString, expectedHeaders)
    t.end();
  })
});*/


/*
test.cb('setHeader method should overwrite header with the same name', t => {
  const expectedHeaders = 'content-length: 10000';
  let buffer = Buffer.alloc(0);

  const fakeSocket = new Writable({
    write: (chunk, enc, next) => {
      buffer = Buffer.concat([buffer, chunk]);
      next();
    }
  });

  const fakeReadable = new Readable({ read: () => { } });
  const response = new HttpResponse(fakeSocket);

  fakeReadable.push(fakeData);
  fakeReadable.push(null);

  response.setHeader('content-length', 100);
  response.setHeader('Content-length', 10000);

  const stream = fakeReadable.pipe(response);

  stream.on('finish', () => {
    const indexOfHeadersEnd = buffer.indexOf('\r\n\r\n');
    const headersBuffer = buffer.slice(0, indexOfHeadersEnd);
    const headersArr = headersBuffer.toString().split('\r\n');
    headersArr.splice(0, 1);
    const headersString = headersArr.join('\r\n');

    t.is(headersString, expectedHeaders)
    t.end();
  })
});

test.cb('writeHead method should send headers', t => {
  const expectedHeaders = ['content-length: 100', 'content-type: text/html'].join('\r\n');
  let buffer = Buffer.alloc(0);

  const fakeSocket = new Writable({
    write: (chunk, enc, next) => {
      buffer = Buffer.concat([buffer, chunk]);
      next();
    }
  });

  const fakeReadable = new Readable({ read: () => { } });
  const response = new HttpResponse(fakeSocket);

  fakeReadable.push(fakeData);
  fakeReadable.push(null);

  response.setHeader('content-length', 100);
  response.setHeader('content-type', 'text/html');
  response.writeHead(200);

  const stream = fakeReadable.pipe(response);

  stream.on('finish', () => {
    const indexOfHeadersEnd = buffer.indexOf('\r\n\r\n');
    const headersBuffer = buffer.slice(0, indexOfHeadersEnd);
    const headersArr = headersBuffer.toString().split('\r\n');
    headersArr.splice(0, 1);
    const headersString = headersArr.join('\r\n');

    t.is(headersString, expectedHeaders)
    t.end();
  })
});


test.cb('Resonse should correctly send chunked data', t => {
  const expectedHeaders = ['content-length: 100', 'content-type: text/html'].join('\r\n');
  const chunk1 = 'chunk1';
  const chunk2 = 'chunk2';
  const chunk3 = 'chunk3';
  const chunk4 = 'chunk4';
  const expectedBody = 'chunk1chunk2chunk3chunk4'
  let buffer = Buffer.alloc(0);

  const fakeSocket = new Writable({
    write: (chunk, enc, next) => {
      buffer = Buffer.concat([buffer, chunk]);
      next();
    }
  });

  const fakeReadable = new Readable({ read: () => { } });
  const response = new HttpResponse(fakeSocket);

  fakeReadable.push(chunk1);
  fakeReadable.push(chunk2);
  fakeReadable.push(chunk3);
  fakeReadable.push(chunk4);
  fakeReadable.push(null);

  response.setHeader('content-length', 100);
  response.setHeader('content-type', 'text/html');

  const stream = fakeReadable.pipe(response);

  stream.on('finish', () => {
    const indexOfHeadersEnd = buffer.indexOf('\r\n\r\n');
    const bodyBuffer = buffer.slice(indexOfHeadersEnd + 4);
    const body = bodyBuffer.toString();
    t.is(body, expectedBody);
    t.end();
  })
});*/

/* http module */

/*
test('Should contain createServer function, which return instance of HTTP server', t => {
  class FakeRequest extends EventEmitter { };
  class FakeResponse extends EventEmitter { };
  class FakeNetServer extends EventEmitter {
    constructor() { super(); }
    static createServer() {
      return new FakeNetServer();
    }
  }

  const HttpServer = proxyquire(pathToHttpModule, {
    'net': FakeNetServer,
    './request': FakeRequest,
    './response': FakeResponse
  }).default;

  const server = HttpServer.createServer();
  t.true(server instanceof HttpServer);
});

test.cb('Should emit request event', t => {
  class FakeRequest extends EventEmitter {
    constructor(socket) {
      super();
      socket.on('headers', () => { this.emit('headers') });
    }
  };
  class FakeResponse extends EventEmitter { };
  class FakeNetServer extends EventEmitter {
    constructor() {
      super();
    }

    listen(port) {
      this.port = port;
    }
  }

  const fakeSocket = new EventEmitter();
  const fakeNetObj = new FakeNetServer();
  const fakeNet = { createServer: () => fakeNetObj }
  const HttpServer = proxyquire('../src/http/http.js', {
    'net': fakeNet,
    './request': FakeRequest,
    './response': FakeResponse,
  }).default;

  const server = HttpServer.createServer();

  server.on('request', () => {
    t.end();
  })

  fakeNetObj.emit('connection', fakeSocket);
  fakeSocket.emit('headers');
});

test.cb('Should emit request event', t => {
  class FakeRequest extends EventEmitter {
    constructor(socket) {
      super();
      socket.on('headers', () => { this.emit('headers') });
    }
  };
  class FakeResponse extends EventEmitter { };
  class FakeNetServer extends EventEmitter {
    constructor() {
      super();
    }

    listen(port) {
      this.port = port;
    }
  }

  const fakeSocket = new EventEmitter();
  const fakeNetObj = new FakeNetServer();
  const fakeNet = { createServer: () => fakeNetObj }
  const HttpServer = proxyquire('../src/http/http.js', {
    'net': fakeNet,
    './request': FakeRequest,
    './response': FakeResponse,
  }).default;

  const server = HttpServer.createServer();

  server.on('request', () => {
    t.end();
  })

  fakeNetObj.emit('connection', fakeSocket);
  fakeSocket.emit('headers');
});

*/
/*
req	Should correctly handle when headers come in multiple chunks
req	HttpRequest is ReadableStream and contain body without headers
req	HttpRequest should emit close event if socket was closed
req	Should correctly handle when headers come in multiple chunks and chunks spilt like ....\r\n  and \r\n + data
parser	Should correctly parse headers, method & url fields
req Should be closed on timeout then connection is closed

res	Call to setHeader after headers have been sent should emit error
res	Call to writeHead shoud send headers with corresponding status line
res	call to writeHead after head was already written should emit error
res	HttpResponse have setHeader method
res	All headers added with setHeader should be sent to socket
res	setHeader method should overwrite header with the same name 
res	writeHead method should send headers
res	Should correctly send data in chunks to destination
res	HttpResponse should be WritableStream
res	HttpResponse writeHead function should merge headers passed with previously set by setHeader
res	If writeHead invoked with not a number in arguments, HttpResponse should emit error


http	Should contain createServer function
http	HTTP server correctly sends files to several clients simultaneously
http	HttpServer should close socket, when response end, and we are not in Keep-Alive mode. Maybe response end ???
http	call to HttpServer listen should start server on corresponding port
http	HttpServer should emit request event
http	HttpServer should handle errors on socket
*/