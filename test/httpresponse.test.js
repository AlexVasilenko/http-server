/*
res	Call to setHeader after headers have been sent should emit error
res	Call to writeHead shoud send headers with corresponding status line
res	call to writeHead after head was already written should emit error
res	If writeHead is invoked with not a number in arguments, HttpResponse should emit error
res	HttpResponse have setHeader method
res	All headers added with setHeader should be sent to socket
res	setHeader method should overwrite header with the same name 
res	writeHead method should send headers
res	Should correctly send data in chunks to destination
res	HttpResponse should be WritableStream
res	HttpResponse writeHead function should merge headers passed with previously set by setHeader
*/

import test from 'ava';
import assert from 'assert';
import HttpResponse from '../src/http/response';
import { Readable, Writable } from 'stream';

const expectedHeaders = [
  'HTTP/1.1 200',
  'content-length: 1000',
  'content-type: text/plain'
].join('\r\n') + '\r\n\r\n';

const fakeData = 'fake data';

test.cb('Call to setHeader if headers have been already sent should emit error', t => {
  const fakeSocket = new Writable({ write: () => { } });
  const fakeReadable = new Readable({ read: () => { } });
  const response = new HttpResponse(fakeSocket);

  fakeReadable.push('fake data');
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

test.cb('Call to writeHead shoud send headers with corresponding status line', t => {
  let buffer = Buffer.alloc(0);
  const fakeSocket = new Writable({
    write: (chunk, enc, next) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.indexOf('\r\n\r\n')) fakeSocket.emit('close');
      next();
    }
  });

  const response = new HttpResponse(fakeSocket);

  fakeSocket.on('close', () => {
    const recievedHeaders = buffer.toString();
    t.true(expectedHeaders === recievedHeaders);
    t.end();
  });

  response.setHeader('Content-length', 1000);
  response.setHeader('Content-Type', 'text/plain');
  response.writeHead(200);
});

test.cb('Call to writeHead should be able to send headers & merge them', t => {
  let buffer = Buffer.alloc(0);
  const fakeSocket = new Writable({
    write: (chunk, enc, next) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.indexOf('\r\n\r\n')) fakeSocket.emit('close');
      next();
    }
  });

  const response = new HttpResponse(fakeSocket);

  fakeSocket.on('close', () => {
    const recievedHeaders = buffer.toString();
    t.deepEqual(expectedHeaders, recievedHeaders);
    t.end();
  });

  response.setHeader('Content-Length', 100);

  response.writeHead(200, {
    'Content-Length': 1000,
    'Content-Type': 'text/Plain'
  });
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

test('If writeHead is invoked with not a number in arguments, HttpResponse should emit error', t => {
  const fakeSocket = new Writable({ write: () => { } });
  const response = new HttpResponse(fakeSocket);
  function setUncorrectWriteHead() {
    response.writeHead('some wrong data');
  }
  assert.throws(setUncorrectWriteHead, Error);
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
});

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

test.cb('Resonse should be WritableStream and correctly send chunked data', t => {
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
    t.true(response instanceof Writable);
    t.is(body, expectedBody);
    t.end();
  })
});

