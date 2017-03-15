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

//
//
// - num
//     - 0x00- negative int
//     - 0x1f double
//     - 0x20- positive int
//     - 0x3f null
// - varstr
//     - 0x40- string
//     - 0x5f true
//     - 0x60- binary
//     - 0x7f false
// - stream
//     - 0x80- array-stream
//     - 0x9f end-of-stream
//     - 0xa0- obj-stream
// - indexed Not implemented yet
//     - 0xc0- array
//     - 0xe0- object
//


// # State

var buf = new Uint8Array(1024); 
var converter = new ArrayBuffer(8);
var converterFloat = new Float64Array(converter);
var converterBytes = new Uint8Array(converter);
var pos;
var END = {};

// # Utility
function addByte(b) { // ##
  if(pos >= buf.length) {
    var t = new Uint8Array(pos * 2 | 0);
    t.set(buf);
    buf = t;
  }
  buf[pos++] = b;
}

function writeFloat(d) { // ##
  converterFloat[0] = d;
  for(var i = 0; i < 8; ++i) {
    addByte(converterBytes[i]);
  }
}

function writeHeader(type, i) { // ##
  if(i < 30) {
    addByte(type | i);
  } else {
    addByte(type | 30);
    vbenc(i - 30);
  }
}

function vbenc(i) { // ##
  if(i >= 128) {
    if(i >= 128*128) {
      if(i >= 128*128*128) {
        if(i >= 128*128*128*128) {
          addByte((i >> 28) | 128);
        }
        addByte((i >> 21) | 128);
      }
      addByte((i >> 14) | 128);
    }
    addByte((i >> 7) | 128);
  }
  addByte(i & 127);
}
function utf8length(str) { // ##
  var len = 0;
  for(var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    ++len;
    if(c > 127) ++len;
    if(c > 0x7FF) ++len;
  }
  return len;
}
function writeUtf8(str) { // ##
  for(var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if(c < 128) {
      addByte(c);
    } else { // utf-8 encoding of UCS-2
      if(c <= 0x7FF) {
        addByte((0x80 | 0x40) | (c >> 6));
        addByte((0x80) | (c & 0x3f));
      } else {
        addByte((0x80 | 0x40 | 0x20 ) | (c >> 12));
        addByte((0x80) | ((c >> 6) & 0x3f));
        addByte((0x80) | (c & 0x3f));
      }
    }
  }
}

function readFloat(buf, pos) { // ##
  for(var i = 0; i < 8; ++i) {
    converterBytes[i] = buf[pos+i];
  }
  return [converterFloat[0], pos + 8];
}

function readStr(buf, pos, end) { // ##
  var result = '';
  while(pos < end) {
    var c = buf[pos++];
    if(c & 128) { // utf-8 decoding into UCS-2
      var b = c;
      c = ((c & 0x1f) << 6) | (buf[pos++] & 0x3f);
      if((b & 0xe0) === 0xe0) { // three
        c = (c << 6) | (buf[pos++] & 0x3f);
      }
    }
    result += String.fromCharCode(c);
  }
  return [result, pos];
}

// # encode
function encode(o) {
  if(o === null) return addByte(0x3f);
  if(o === true) return addByte(0x5f);
  if(o === false) return addByte(0x7f);
  if(o === END) return addByte(0x9f);
  if(typeof o === 'number') {
    if(o === (o|0)) {
      if(o < 0) {
        return writeHeader(0x00, ~o);
      } else {
        return writeHeader(0x20, o);
      }
    }
    addByte(0x1f);
    return writeFloat(o);
  }
  if(typeof o === 'string') {
    writeHeader(0x40, utf8length(o));
    return writeUtf8(o);
  }
  if(Array.isArray(o) || o.constructor === Object) {
    var type;
    var len;
    if(Array.isArray(o)) {
        type = 0x80;
        len= o.length;
    } else {
        type = 0xa0;
        var arr = [];
        for(var k in o) {
          arr.push(k, o[k]);
        }
        len  = (arr.length / 2);
        o = arr;
    }
    writeHeader(type, len + 1);
    for(var i = 0; i < o.length; ++i) {
      encode(o[i]);
    }
    return;
  }
  if(o.constructor === Uint8Array) {
    writeHeader(0x60, o.length);
    for(var i = 0; i < o.length; ++i) {
      addByte(o[i]);
    }
    return;
  }
}
// # decode
function decode(buf, pos) {
  var type = buf[pos++];
  var num;
  if((type & 31) < 30) {
    num = type & 31;
  } else if((type & 31) === 30) {
    num = 0;
    do {
      var c = buf[pos++];
      num = (num << 7)+ (c & 127);
    } while(c & 128);
    num += 30;
  } else {
    if(type === 0x1f) return readFloat(buf, pos);
    if(type === 0x3f) return [null, pos];
    if(type === 0x5f) return [true, pos];
    if(type === 0x7f) return [false, pos];
    if(type === 0x9f) return [END, pos];
  }
  switch(type >>> 5) {
    case 0: // ## Negative Number
      return [~num, pos];
    case 1: // ## Positive Number
      return [num, pos];
    case 2: // ## String
        return readStr(buf, pos, pos+num);
    case 3: // ## Binary
      return [buf.slice(pos, pos + num), pos];
    case 4: case 5: // ## Streamable collections
      if(num === 0) {
        throw 'Streamed collections not implemented yet.';
      }
      --num;
      if(type >>> 5 === 5) { // Object
        num = 2*num;
      }
      var arr = new Array(num);
      for(var i = 0; i < num; ++i) {
        [arr[i], pos] = decode(buf, pos)
      }
      if(type >>> 5 === 5) { // Object
        var result = {};
        for(var i = 0; i < arr.length; i += 2) {
          result[arr[i]] = arr[i + 1];
        }
        return [result, pos];
      }
      return [arr, pos];

    case 6: case 7: // ## Indexed collections
      throw 'indexed collections not implemented yet.';
  }
}
// # exports
var bion;
if(true) {
  bion = exports;
} else {
  bion = self.Bion = {};
}
bion.encode = (o) => {
  pos = 0;
  encode(o);
  return buf.slice(0, pos);
}
bion.decode = (o) => decode(o, 0)[0];


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
let HashAddress = __webpack_require__(3);
let bion= __webpack_require__(0);
let sea = new EventEmitter();
sea.net = new EventEmitter();
let publicKey;
module.exports = sea;

var connections = [];


// ## Handle connection
sea.on('connect:socket', (con) => {
  con.send({
    type: 'helo',
    id: sea.id.toUint8Array()
  });
  var id;
  con.once('message', (msg) => {
    id = HashAddress.fromUint8Array(msg.id);
    connections.push({id: id, con: con});
    con.on('message', (msg) => {
      if(sea.id.equals(HashAddress.fromUint8Array(msg.dst))) {
        sea.net.emit(msg.type, msg, id);
      } else {
        relay(msg);
      }
    });
    console.log('Connected to ' + id.toHex());
  });

  con.on('close', () => {
    connections = connections.filter(o => !o.id.equals(id));
    console.log('close');
  });
});

main();

async function main() { // ##
  await generateId();
  if(self.node_modules) {
    startWsServer();
  } else {
    let connected = false;
    while(!connected) {
      try {
        await connectToWs('ws://localhost:8888/');
        connected = true;
      } catch(e) {
        console.log('error', e);
        await sleep(1000);
      }
    }
  }
}

async function generateId() { // ##
  let key = await crypto.subtle.generateKey({
    name: 'ECDSA', 
    namedCurve: 'P-521'
  }, true, ['sign', 'verify']);
  publicKey = await crypto.subtle.exportKey('spki', key.publicKey);
  sea.id = await HashAddress.generate(publicKey);
  sea.emit('ready');
  console.log('My id: ' + sea.id.toHex());
}

function connectToWs(host) { // ##
  return new Promise((resolve, reject) => {
    let ws = new WebSocket(host);
    ws.binaryType = 'arraybuffer';
    let con = new EventEmitter();
    con.send = (o) => ws.send(encode(o));
    con.close = () => ws.close();
    ws.addEventListener('message', (msg) => {
      con.emit('message', decode(msg.data));
    });
    ws.addEventListener('open', (msg) => {
      sea.emit('connect:socket', con);
      resolve();
    });
    ws.addEventListener('close', (msg) => {
      con.emit('close');
    });
    ws.addEventListener('error', (msg) => {
      reject(msg);
    });
  });
}

function startWsServer() { // ##
  let server = node_modules.http.createServer();
  let  wss = new node_modules.ws.Server({server: server});

  let sockets = {};
  wss.on('connection', (ws) => {
    let con = new EventEmitter();
    con.send = (o) => ws.send(encode(o));
    con.close = (o) => ws.close();

    sea.emit('connect:socket', con);
    ws.on('message', (msg) => con.emit('message', decode(msg)));
    ws.on('close', () => con.emit('close'));
    ws.on('error', (e) => con.emit('error', e));
  });

  server.listen(8888, () => {
    console.log('Started websocket server on port: ' + server.address().port);
  });
}

// ## Utility functions
function encode(obj) { // ###
  return bion.encode(obj).buffer;
}

function decode(obj) { // ###
  return bion.decode(new Uint8Array(obj));
}

function sleep(ms) {// ###
  return new Promise(resolve => setTimeout(resolve, ms));
}

// # Old
(async function() {


  if(self.node_modules) {
  } else { // isBrowser
    setTimeout(browserMain, 200 + 200 * Math.random());
  }

  function print(s) {
    document.body.innerHTML += s;
  }

  async function browserMainX() {
    var ws = new WebSocket('ws://localhost:8888/');
    ws.addEventListener('message', (msg) => {
      console.log('message', msg);
    });
    ws.addEventListener('open', (msg) => {
      ws.send(bion.encode({type: 'helo', data: 'me'}));
      console.log('open', msg);
    });
    ws.addEventListener('close', (msg) => {
      console.log('close', msg);
    });
    ws.addEventListener('error', (msg) => {
      console.log('error', msg);
    });
  }
  async function browserMain() {
    console.log('browser');
    var id;
    var peerIds;
    var ws = new WebSocket('ws://localhost:8888/');
    ws.addEventListener('message', (msg) => {
      msg = JSON.parse(msg.data);
      console.log(msg);
      switch(msg.mbox) {
        case 'welcome':
          id = msg.id;
          peerIds = msg.peers;
          print(`id: ${id}<br>`);
          if(peerIds.length) {
            connect();
          }
          break;
        case 'ice':
          connect(msg);
          break;
      }
    });

    // Stun server list from https://gist.github.com/zziuni/3741933
    var iceServers = ['stun.l.google.com:19302', 'stun1.l.google.com:19302',
    'stun2.l.google.com:19302', 'stun3.l.google.com:19302',
    'stun4.l.google.com:19302', 'stun01.sipphone.com', 'stun.ekiga.net',
    'stun.fwdnet.net', 'stun.ideasip.com', 'stun.iptel.org',
    'stun.rixtelecom.se', 'stun.schlund.de', 'stunserver.org',
    'stun.softjoys.com', 'stun.voiparound.com', 'stun.voipbuster.com',
    'stun.voipstunt.com', 'stun.voxgratia.org', 'stun.xten.com'];
    iceServers = iceServers.map(s => ({url: 'stun:' + s}));

    var connections = self.cons = {};
    var chans = self.chans = {};

    function setupChan(chan, target) {
      chan.onopen = (e) => {
        console.log('onopen', e);
        setTimeout(() => e.target.send('hello'), 500);
      };
      chan.onmessage = (e) => {
        console.log('onmessage', e);
      };
      chan.onclose= (e) => {
        console.log('onclose', e);
      };
      chans[target ] = chan;
    }

    function getCon(target, createChan) {
      if(connections[target]) {
        return connections[target];
      }

      var con = new RTCPeerConnection({ 'iceServers': iceServers });
      con.ondatachannel = (e) => {
        setupChan(e.channel);
        console.log('ondatachannel', e);
        e.channel.send('hi');
      };
      con.onicecandidate = (e) => {
        if(e.candidate) {
          ws.send(JSON.stringify({
            src: id,
            dst: target,
            mbox: 'ice', 
            ice: con.localDescription, 
          }));
        } else {
        }
        console.log('onicecandidata', e);
      }
      connections[target] = con;

      if(createChan) {
        var chan = con.createDataChannel("sendChannel", {
          ordered: false
        });
        setupChan(chan, target);
      }
      return con;
    }

    async function connect(msg) {
      console.log('connect', msg);
      if(!msg) {
        var con = getCon(peerIds[0], true);
        var offer = await con.createOffer();
        con.setLocalDescription(offer);

      } else if(msg.ice) {
        console.log('got ice', msg.ice);
        var con = getCon(msg.src);
        con.setRemoteDescription(new RTCSessionDescription(msg.ice));

        if(msg.ice.type === 'offer') {
          var answer = await con.createAnswer();
          con.setLocalDescription(answer);
        }
      }
    }
  }
});
(async () => {

  var CBOR;
  // QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n
  json = { 
    "Data":"", 
    "Links":[],
  };
  var cbor = CBOR.encode(json)
    var ua = Array.from(new Uint8Array(cbor));
  console.log(cbor.byteLength, String.fromCharCode.apply(null, ua), ua.map(o => o.toString(16)));
  var d1 = new Uint8Array(cbor.byteLength + 1);
  console.log(d1, cbor);
  d1[0] = 0x51;
  d1.set(new Uint8Array(cbor), 1);
  data = d1;
  var ua = Array.from(new Uint8Array(data));
  console.log('x', data.byteLength, String.fromCharCode.apply(null, ua), ua.map(o => o.toString(16)));
  var hash = await crypto.subtle.digest('SHA-256', data);
  console.log('hash', hash, hash.byteLength);
  var ta = new Uint8Array(34);
  ta[0] = 0x12;
  ta[1] = 0x20;
  ta.set(new Uint8Array(hash), 2);
  console.log(ta, Base58.encode(ta), hash);
})


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, process) {/*
 * Hashes as addresses, and utility functions for Kademlia-like routing.
 */
class HashAddress { // #

  constructor(o) { // ##
    if(o instanceof Uint8Array && o.length === 32) {
      this.data = o;
    } else {
      throw new Error();
    }
  }

  static async generate (src /*ArrayBuffer | String*/) { // ##
    if(typeof src === 'string') {
      src = ascii2buf(src);
    }
    let hash = await crypto.subtle.digest('SHA-256', src);
    return new HashAddress(new Uint8Array(hash));
  }

  equals(addr) { // ##
    for(let i = 0; i < 32; ++i) {
      if(this.data[i] !== addr.data[i]) {
        return false;
      }
    }
    return true;
  }

  static async TEST_constructor_generate_equals() { // ##
    if(typeof crypto === 'undefined') {
      return;
    }
    let a = await HashAddress.generate('hello world');
    let b = await HashAddress.generate('hello world');
    let c = await HashAddress.generate('hello wørld');
    a.equals(b) || throwError('equals1');
    !a.equals(c) || throwError('equals2');
  }

  static fromUint8Array(buf) { // ##
    return new HashAddress(buf.slice());
  }
  toUint8Array() { // ##
    return this.data.slice();
  }

  static fromArrayBuffer(buf) { // ##
    return HashAddress.fromUint8Array(new Uint8Array(buf));
  }

  static fromString(str) { // ##
    return HashAddress.fromArrayBuffer(ascii2buf(atob(str)));
  }

  static fromHex(str) {  // ##
    return HashAddress.fromArrayBuffer(hex2buf(str));
  }

  toArrayBuffer() { // ##
    return this.data.slice().buffer;
  }

  toString() { // ##
    return btoa(buf2ascii(this.toArrayBuffer()));
  }

  toHex() { // ##
    return buf2hex(this.toArrayBuffer());
  }


  static async TEST_from_toArrayBuffer_toString() { // ##
    let a = await HashAddress.generate('hello');
    let b = HashAddress.fromArrayBuffer(a.toArrayBuffer());
    let c = HashAddress.fromString(a.toString());
    let x80 = HashAddress.fromString('gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    a.equals(b) || throwError();
    a.equals(c) || throwError();
    x80.toHex().startsWith('800') || throwError();
  }

  // ## .dist(addr)
  /*
   * xor-distance between two addresses, - with 24 significant bits, 
   * and with an offset such that the distance between `0x000..` 
   * and `0x800...` is `2 ** 123`, and distance `0b1111..` and 
   * `0b1010111..` is `2**122 + 2**120`. 
   * This also means that the distance can be represented 
   * within a single precision float. (with some loss on least significant bits)
   */
  dist(addr) {
    let a = new Uint8Array(this.data);
    let b = new Uint8Array(addr.data);
    for(let i = 0; i < 32; ++i) {
      if(a[i] !== b[i]) {
        return (2 ** (93 - i*8)) *
          (((a[i] ^ b[i]) << 23) |
          ((a[i + 1] ^ b[i + 1]) << 15) |
          ((a[i + 2] ^ b[i + 2]) << 7) |
          ((a[i + 3] ^ b[i + 3]) >> 1));
      }
    }
    return 0;
  }

  // ## distBit(addr)
  /* 
   * index of first bit in addr that is different. 
   */
  distBit(addr) {
    return HashAddress.distBit(this.dist(addr));
  }

  // ## static distBit(addr)
  /*
   * addr1.logDist(addr2) === HashAddress.logDist(addr1.dist(addr2))
   */
  static distBit(dist) {
    return 123 - Math.floor(Math.log2(dist));
  }

  static TEST_dist() { // ##
    let h;
    let zero = 
      HashAddress.fromHex('0000000000000000000000000000000000000000000000000000000000000000');

    h=HashAddress.fromHex('0000000000000000000000000000001000000000000000000000000000000000');
    zero.dist(h) === 1 || throwError();

    h=HashAddress.fromHex('8000000000000000000000000000000000000000000000000000000000000000');
    zero.dist(h) === 2 ** 123 || throwError();
    zero.distBit(h) === 0 || throwError();

    h=HashAddress.fromHex('0000000000000000000000000000000000000000000000000000000000000001');
    zero.dist(h) === 2 ** -132|| throwError();
    zero.distBit(h) === 255 || throwError();

    h=HashAddress.fromHex('0f00000000000000000000000000000000000000000000000000000000000000');
    zero.distBit(h) === 4 || throwError();
  }

  // ## flipBitRandomise
  /**
   * Flip the bit at pos, and randomise every bit after that
   */
  flipBitRandomise(pos) {
    let src = new Uint8Array(this.data);
    let dst = src.slice();
    let bytepos = pos >> 3;
    crypto.getRandomValues(dst.subarray(bytepos));

    let mask = 0xff80 >> (pos & 7);
    let inverse = 0x80 >> (pos & 7);
    dst[pos >> 3] = (src[bytepos] & mask) | (dst[bytepos] & ~mask) ^ inverse;

    return new HashAddress(dst);
  }

  static TEST_flipBitRandomise() { // ##
    let zero = 
      HashAddress.fromHex('0000000000000000000000000000000000000000000000000000000000000000');

    zero.flipBitRandomise(3).toHex().startsWith('1') || throwError();
    zero.flipBitRandomise(7).toHex().startsWith('01') || throwError();
    zero.flipBitRandomise(7+8).toHex().startsWith('0001') || throwError();
  }
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

// # Export + testrunner
(()=>{
  let runTest = (cls) => Promise.all(
      Object.getOwnPropertyNames(HashAddress)
      .filter(k => k.startsWith('TEST_'))
      .map(k => (console.log(k), k))
      .map(k => HashAddress[k]())
      .map(v => Promise.resolve(v)));

  if(true) {
    module.exports = HashAddress;
    if(__webpack_require__.c[__webpack_require__.s] === module) {
      runTest(HashAddress)
        .then(() => process.exit(0))
        .catch(e => {
          console.log(e);
          process.exit(0);
        });
    }
  } else if(typeof RUNTEST_hashaddress !== 'undefind') {
    runTest(HashAddress);
  }
})()

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module), __webpack_require__(4)))

/***/ }),
/* 4 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ })
/******/ ]);
//# sourceMappingURL=dist.js.map