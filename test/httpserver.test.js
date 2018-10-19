/*
http	Should contain createServer function
http	HttpServer should emit request event

http	HTTP server correctly sends files to several clients simultaneously
Посчитать длину байтов и хеш большого файла.Создать фейковый HttpRequest, который отдает этот файл.	
Отправить GET запрос 5 раз, ждать пока файл скачается 5 раз.	
Проверить хеш и длину каждого файла

http	HttpServer should close socket, when response end, and we are not in Keep-Alive mode. Maybe response end ???
http	call to HttpServer listen should start server on corresponding port
http	HttpServer should handle errors on socket
*/

import test from 'ava';
import assert from 'assert';
import { Readable, Writable } from 'stream';
import EventEmitter from 'events';
import Proxyquire from 'proxyquire';
import sinon from 'sinon';
import config from 'config';

const proxyquire = Proxyquire.noCallThru();
const pathToHttpModule = '../src/http/http';
const FIXTURES_PATH = config.get('testFixturesPath');
const PORT = config.get('port');

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
