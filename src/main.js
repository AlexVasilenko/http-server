import config from 'config';
import server from './server';

const PORT = config.get('port');

server.listen(PORT);