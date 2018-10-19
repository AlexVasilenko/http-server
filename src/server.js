import fs from 'mz/fs';
import mime from 'mime';
import config from 'config';
import myHttp from './http';

const PUBLICROOT = config.get('publicRoot');
const server = myHttp.createServer();

server
  .on('request', (req, res) => {
    const contentType = mime.lookup(`${PUBLICROOT}/foo.html`);
    res.setHeader('Content-Type', contentType);

    fs.stat(`${PUBLICROOT}/foo.html`)
      .then((stats) => {
        res.setHeader('Content-Length', stats.size);
        res.writeHead(200);

        const stream = fs.createReadStream(`${PUBLICROOT}/foo.html`).pipe(res);

        stream.on('error', (err) => {
          console.error('The error raised was:', err);
        })
      })
      .catch((error) => { console.error(error) })
  })
  .on('error', (error) => { console.error(error) })

export default server;