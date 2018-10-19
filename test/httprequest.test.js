/*
req	HttpRequest is ReadableStream and contain body without headers
req	Should correctly handle when headers come in multiple chunks and chunks spilt like ....\r\n  and \r\n + data
req	Should correctly parse headers, method & url fields
req	HttpRequest should emit close event if socket was closed
req should support body with \r\n\r\n chars
*/

import test from 'ava';
import HttpRequest from '../src/http/request';
import { Readable } from 'stream';

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

const fakeBrokenHeaders = [
  'GET / HTTP/1.1',
  'Host: localhost:3000',
  'Cookie: mp_e5f9054305ad168448cfca228946c713_mixpanel=%7B%22distinct_id%22%3A%20%22159eb47ede21a9-06417fb276297a-1a441228-fa000-159eb47ede33ce%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; _ga=GA1.1.1329312924.1478369196; mp__mixpanel=%7B%22distinct_id%22%3A%20%221582fe175ad100-063b43c6aa438f-4b183205-fa000-1582fe175ae56d%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D',
  'Connection: keep-alive'
].join('\r\n');

const expectedMethod = 'GET';
const expectedPath = '/';
const expectedBody = 'fake body\r\n\r\nfake body\r\n\r\nfake body';
const fakeRequest = `${fakeHeaders}fake body\r\n\r\nfake body\r\n\r\nfake body`;

test.cb('Request is ReadableStream & contain body without headers & does not miss \\r\\n\\r\\n in body', t => {
  const fakeSocket = new Readable({ read: () => { } });
  const request = new HttpRequest(fakeSocket);
  let buffer = Buffer.alloc(0);

  request.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);
  }).on('end', () => {
    t.true(request instanceof Readable);
    t.is(buffer.toString(), expectedBody);
    t.end();
  });

  fakeSocket.push(fakeRequest);
  fakeSocket.push(null);
});

test.cb('Request should support chunked headers & chunks like \\r\\n, \\r\\n + data', t => {
  const fakeSocket = new Readable({ read: () => { } });
  const request = new HttpRequest(fakeSocket);
  const fakeHeadersPart1 = fakeHeaders.substr(0, ~~(fakeHeaders.length / 2));
  const fakeHeadersPart2 = fakeHeaders.substr(fakeHeadersPart1.length, (fakeHeaders.length - 2));
  const fakeHeadersPart3 = fakeHeaders.substr((fakeHeaders.length - 2), fakeHeadersPart1.length);

  request.on('headers', () => {
    t.deepEqual(request.headers, expectedHeaders);
    t.pass();
    t.end();
  });

  fakeSocket.push(fakeHeadersPart1);
  fakeSocket.push(fakeHeadersPart2);
  fakeSocket.push(fakeHeadersPart3);
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
});

test.cb('Request should emit close event if socket was closed', t => {
  const fakeSocket = new Readable({ read: () => { } });
  const request = new HttpRequest(fakeSocket);

  request.on('close', () => {
    t.end();
  });

  fakeSocket.emit('close');
});
