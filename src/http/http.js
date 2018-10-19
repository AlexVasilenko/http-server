import EventEmiter from 'events';
import net from 'net';
import HttpRequest from './request';
import HttpResponse from './response';

class HttpServer extends EventEmiter {

  constructor(props) {
    super(props);
    this.server = net.createServer();

    this.server.on('connection', socket => {
      const req = new HttpRequest(socket);
      const res = new HttpResponse(socket);

      req.on('headers', () => {
        this.emit('request', req, res);
      })

      socket.on('error', (error) => {
        this.emit('error', error);
      })
    });
  }

  static createServer() {
    return new HttpServer();
  }

  listen(port) {
    this.server.listen(port);
  }
}

export default HttpServer;
