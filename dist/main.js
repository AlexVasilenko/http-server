'use strict';

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _server = require('./server');

var _server2 = _interopRequireDefault(_server);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PORT = _config2.default.get('port');

_server2.default.listen(PORT);
//# sourceMappingURL=main.js.map