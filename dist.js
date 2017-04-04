/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

// Hashes as addresses, and utility functions for Kademlia-like routing.
//

let length = 96/6;
let tests = {};
// # Base64 alphabet
let base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
tests.TEST_base64 = () => {
  base64[63] === '/' || throwError();
}

async function hashAddress(src) { // #
  if(typeof src === 'string') {
    src = ascii2buf(src);
  }
  let hash = await crypto.subtle.digest('SHA-256', src);
  return btoa(buf2ascii(new Uint8Array(hash))).slice(0,length);
}
tests.TEST_hashAddress = async () => {
  (await hashAddress('hello')) === 'LPJNul+wow4m6Dsq' || throwError();
}

// # `dist(a,b)`
//
// Calculate xor-distance between two base64 addresses.
//
function dist(a, b) {
  let len = Math.min(a.length, b.length);
  let dist = 0;
  let i = 0;
  for(;;) {
    va = base64.indexOf(a[i]);
    vb = base64.indexOf(b[i]);
    if(va === -1 || vb === -1) {
      return dist;
    }
    dist += (va ^ vb) * (2 ** (-5 - 6*i));
    ++i;
  }
}
tests.TEST_distBit = () => {
  dist('Abracadabra', 'Abracadabra') === 0 || throwError();
  dist('A', 'B') ===  2 ** -5 || throwError();
}

// # `distBit(a,b)`
//
// Get the position of the first bit that differs in a,b. This is logarithmic xor-distance.
//
function distBit(a, b) {
  return Math.ceil(Math.log(1/dist(a,b)) / Math.log(2));
}
tests.TEST_distBit = () => {
  distBit('A', base64[32]) === 0 || throwError();
  distBit('A', base64[31]) === 1 || throwError();
  distBit('AA', 'A/') === 6 || throwError();
  distBit('A', 'A') === Infinity || throwError();
}

// # `flipBitAndRandom(addr, bitpos)`
//
// Create a new address, preserving the first `bitpos - 1` bits, the bit at `bitpos` is flipped, and the rest of the bits are random.
//
function flipBitAndRandom(addr, bitpos) {
  let result = addr.slice(0, bitpos / 6 | 0);

  let word = base64.indexOf(addr[bitpos / 6 | 0]);
  if(word === -1) {
    word = 0;
  }
  let flipBits = 64 + (Math.random() * 64) >> ((bitpos % 6) + 1);
  word = word ^ flipBits;
  result += base64[word];

  for(let i = (bitpos / 6)+1 | 0; i < length; ++i) {
    result += base64[Math.random() * 64 | 0];
  }

  return result;
}
tests.TEST_flipBitAndRandom = () => {
  flipBitAndRandom('AAAAAA', 11).startsWith('AB') || throwError();
  flipBitAndRandom('//////', 17).startsWith('//+') || throwError();
  flipBitAndRandom('A', 6).startsWith('A') || throwError();
  flipBitAndRandom('B', 5).startsWith('A') || throwError();
  for(let i = 0; i < 10; ++i) {
    "CD".indexOf(flipBitAndRandom('A', 4)[0]) !== -1 || throwError();
    "EFGH".indexOf(flipBitAndRandom('A', 3)[0]) !== -1 || throwError();
  }
}

// # Exports

if(true) {
  exports.hashAddress = hashAddress;
  exports.dist = dist;
  exports.distBit = distBit;
  exports.flipBitAndRandom = flipBitAndRandom;
  exports.TESTS = tests;
}

// # Utility functions

function hex2buf(str) { // ##
  let a = new Uint8Array(str.length / 2);
  for(let i = 0; i < str.length; i += 2) {
    a[i / 2] = parseInt(str.slice(i, i+2), 16);
  }
  return a.buffer;
}
function buf2hex(buf) { // ##
  let a = new Uint8Array(buf);
  let str = '';
  for(var i = 0; i < a.length; ++i) {
    str += (0x100 + a[i]).toString(16).slice(1);
  }
  return str;
}
function ascii2buf(str) { // ##
  let a = new Uint8Array(str.length);
  for(let i = 0; i < a.length; ++i) {
    a[i] = str.charCodeAt(i);
  }
  return a.buffer;
}

function buf2ascii(buf) { // ##
  let a = new Uint8Array(buf);
  return String.fromCharCode.apply(String, a);
}

function throwError(msg) { // ##
  throw new Error(msg);
}


/***/ }),
/* 1 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

// # Sea.js
//
let EventEmitter = __webpack_require__(1);
let {dist, hashAddress} = __webpack_require__(0);
//let bion = require('bion');
let sea = new EventEmitter();
sea.net = new EventEmitter();
let publicKey;
module.exports = sea;

// ## Connections
var connections = window.connections = [];
function getConnections() { // ###
  return connections
    .filter(o => o.connected)
    .map(o => o.id);
}

function getConnection(id) { // ###
  let con = (connections.filter(o => o.id === id)||[])[0];
  if(!con) {
    con = new EventEmitter();
    con.outgoing = [];
    con.send = (msg) => con.outgoing.push(msg);
    con.id = id;
    con.pubKey = undefined;
    con.connected = false;
    con.con = undefined;
    con.latency = 65535;
    con.timestamp = Date.now();
    con.peers = [];
    connections.push(con);
  }
  return con;
}

function removeConnection(id) { // ###
  for(let i = 0; i < connections.length; ++i) {
    if(connections[i].id === id) {
      connections[i] = connections[connections.length - 1];
      connections.pop();
      return;
    }
  }
}

function nearestConnection(adr) { // ###
  let id = findMin(getConnections(), str => hashDist(str, adr));
  return getConnection(id);
}

// ## Utility functions
function log() { // ###
  let s = str(slice(arguments))
  //console.log(s);
  console.log.apply(console, arguments);
  if(typeof document !== 'undefined') {
    let elem = document.getElementById('info');
    if(elem) {
      elem.innerHTML += 
        new Date().toISOString().slice(11,23) + ' ' + 
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(1,-1) + 
        '\n';
    }
  }
  return arguments[arguments.length - 1];
}

main();
function hashDist(s1, s2) { // ###
  console.log(s1, s2, dist(s1, s2));
  return dist(s1, s2);
}

function slice(o, a, b) { return Array.prototype.slice.call(o, a, b); }
let randomId = () => Math.random().toString(36).slice(2,10);
let timeout = 5000;
function findMin(arr, f) { // ###
  arr = arr || [];
  let min = arr[0];
  for(let i = 1; i < arr.length; ++i) {
    if(f(arr[i]) < f(min)) {
      min = arr[i];
    }
  }
  return min;
}

function encode(obj) { // ###
  //return bion.encode(obj).buffer;
  return JSON.stringify(obj);
}

function decode(obj) { // ###
  //return bion.decode(new Uint8Array(obj));
  return JSON.parse(obj);
}

function sleep(ms) {// ###
  return new Promise(resolve => setTimeout(resolve, ms));
}

function str(o) { // ###
  try {
    return JSON.stringify(o);
  } catch(e) {
    o.toString();
  }
}

async function generateId() { // ###
  let key = await crypto.subtle.generateKey({
    name: 'ECDSA', 
    namedCurve: 'P-521'
  }, true, ['sign', 'verify']);
  publicKey = await crypto.subtle.exportKey('spki', key.publicKey);
  return await hashAddress(publicKey);
}

// ## WebSocket connections
function startWsServer() { // ###
  let server = node_modules.http.createServer();
  let  wss = new node_modules.ws.Server({server: server});

  wss.on('connection', (ws) => {
    var messageHandler;
    var closeHandler;
    handshake({
      send: o => ws.send(encode(o)),
      onMessage: f => messageHandler = f,
      onClose: f => closeHandler = f,
    });
    ws.on('message', (msg) => messageHandler(decode(msg)));
    ws.on('close', () => closeHandler());
  });

  server.listen(8888, () => {
    log('Started websocket server on port: ' + server.address().port);
  });
}

function connectToWs(host) { // ###
  return new Promise((resolve, reject) => {
    let ws = new WebSocket(host);
    ws.binaryType = 'arraybuffer';
    var messageHandler = () => {};
    var closeHandler = () => {};
    ws.addEventListener('open', (msg) => {
      handshake({
        send: o => ws.send(encode(o)),
        onMessage: f => messageHandler = f,
        onClose: f => closeHandler = f,
        resolve,
      });
    });
    ws.addEventListener('message', (msg) => messageHandler(decode(msg.data)));
    ws.addEventListener('close', () => closeHandler());
    ws.addEventListener('error', (msg) => { reject(msg); });
  });
}

// ## WebRTC Connections
var iceServers; // ###
// Stun server list from https://gist.github.com/zziuni/3741933 
iceServers = ['stun.l.google.com:19302', 'stun1.l.google.com:19302',
  'stun2.l.google.com:19302', 'stun3.l.google.com:19302',
  'stun4.l.google.com:19302', 'stun01.sipphone.com', 'stun.ekiga.net',
  'stun.fwdnet.net', 'stun.ideasip.com', 'stun.iptel.org',
  'stun.rixtelecom.se', 'stun.schlund.de', 'stunserver.org',
  'stun.softjoys.com', 'stun.voiparound.com', 'stun.voipbuster.com',
  'stun.voipstunt.com', 'stun.voxgratia.org', 'stun.xten.com'];
iceServers = iceServers.map(s => ({url: 'stun:' + s}));


async function connectVia(through, id) { // ###

  let con = new RTCPeerConnection({ 'iceServers': iceServers });
  con.onicecandidate = iceHandler(through, id);
  con.onerror = log;

  getConnection(id).con = con;

  let chan = con.createDataChannel("sendChannel", { ordered: false });
  addChanHandler(chan, id);

  let offer = await con.createOffer();
  await con.setLocalDescription(offer);

  let answer = await call(through, 'call', 
    id, 'webrtc-offer', through, sea.id, con.localDescription);
  log('got answer:', answer);
  con.setRemoteDescription(answer);
}

exportFn('webrtc-offer', async (through, id, offer) => { // ###
  log('webrtc-offer', id, offer);
  con = new RTCPeerConnection();

  getConnection(id).con = con;

  con.ondatachannel = (e) => {
    log('ondatachannel')
    addChanHandler(e.channel, id);
  };

  con.onicecandidate = iceHandler(through, id);
  con.onerror = log;

  await con.setRemoteDescription(offer);
  let answer = await con.createAnswer();
  con.setLocalDescription(answer);
  return answer;
});


exportFn('ice', (id, ice) => { // ###
  log('addIce', id.slice(0, 5), getConnection(id))
  if(!getConnection(id).connected) {
    getConnection(id).con.addIceCandidate(ice);
  }
  log('ice', id, ice);
});

function addChanHandler(chan, id) { // ###
  log('chan', chan);

  chan.onmessage = (e) => log('msg', e.data);
  chan.onopen = () => {
    log('chan open', id);
    let con = getConnection(id);
    con.connected = true;
    setInterval(() => chan.send('hi from ' + sea.id.slice(0, 5)), 1000);
  }
}

function iceHandler(through, id) { // ###
  return (e) => {
    if(!getConnection(id).connected) {
      if(e.candidate) {
        call(through, 'call', id, 'ice', sea.id, e.candidate);
      }
    }
  }
}
// ## General communication structure
function call(dst, type) { // ###
  let args = slice(arguments, 2);
  log('call ' + type, dst, type, args, arguments);
  return new Promise((resolve, reject) => {
    let id = randomId();
    sea.net.once(id, msg => msg.error ? reject(msg.error) : resolve(msg.data));
    setTimeout(() => sea.net.emit(id, {error: 'timeout'}), timeout);
    relay({dst, type, reply: sea.id, replyType: id, data: args});
  });
}

function exportFn(name, f) { // ###
  sea.net.on(name, async (msg) => {
    let response = { type: msg.replyType, dst: msg.reply};
    try {
      response.data = await f.apply(f, msg.data);
    } catch(e) {
      response.error = String(e);
    }
    relay(response);
  });
}

exportFn('call', call); // ###
function relay(msg) { // ###
  //log('relay ' + msg.dst.slice(0,8) + ' ' + msg.type);
  let con = nearestConnection(msg.dst);
  if(hashDist(con.id, msg.dst) < hashDist(sea.id, msg.dst)) {
    con.send(msg)
  } else {
    log('dropped', msg.type, msg.dst);
  }
}


function handshake({send, resolve, onMessage, onClose}) { // ###
  send({id: sea.id, peers: getConnections()});
  var id;
  onMessage(msg => {
    id = msg.id;
    let con = getConnection(id);
    con.connected = true;
    con.send = send;
    con.peers = msg.peers;
    onMessage(msg => sea.id === msg.dst ? sea.net.emit(msg.type, msg) : relay(msg));
    if(resolve) resolve();
  });
  onClose(() => {
    log('disconnect', id);
    removeConnection(id);
  });
}

// ## Main
async function main() { // ###
  sea.id = await generateId();
  log('My id: ' + sea.id);
  await generateId();
  if(self.node_modules) {
    startWsServer();
  } else {
    let connected = false;
    while(!connected) {
      try {
        await goOnline();
        connected = true;
      } catch(e) {
        log('error', e);
        await sleep(1000);
      }
    }
  }
}
async function goOnline() { // ###
  await connectToWs('ws://localhost:8888/');
  let done = false;
  //do {
  let a = findMin(getConnections(), o => hashDist(sea.id, o));
  log(getConnections());
  log('a', a);
  let b = findMin(getConnection(a).peers,  o => hashDist(sea.id, o));
  log('b', b);
  if(!b || hashDist(sea.id, a) < hashDist(sea.id, b)) {
    log('connected');
    done = true;
  } else {
    log('connectVia', a.slice(0,5), b.slice(0,5));
    await connectVia(a, b);
  }
  //  } while(!done);
}



/***/ })
/******/ ]);
//# sourceMappingURL=dist.js.map