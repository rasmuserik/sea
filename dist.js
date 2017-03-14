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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
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
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

// # Sea.js
let EventEmitter = __webpack_require__(0);
let bion= __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"bion\""); e.code = 'MODULE_NOT_FOUND';; throw e; }()));
let sea = new EventEmitter();
let publicKey;
module.exports = sea;

sea.on('connect:socket', (con) => {
  con.on('message', (msg) => console.log('message', msg));
  con.send({
    type: 'helo',
    id: sea.id
  });
  console.log('connect:socket', con);
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
  sea.id = new Uint8Array(await crypto.subtle.digest('SHA-256', publicKey));
  sea.emit('ready');
}

function connectToWs(host) { // ##
  return new Promise((resolve, reject) => {
    let ws = new WebSocket(host);
    let con = new EventEmitter();
    con.send = (o) => ws.send(encode(o));
    con.close = () => ws.close();
    ws.addEventListener('message', (msg) => {
      console.log('msg',msg);
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
    ws.on('message', (msg) => {
      con.emit('message', decode(msg));
    });
  });

  server.listen(8888, () => {
    console.log('Started websocket server on port: ' + server.address().port);
  });
}

// ## Utility functions
function encode(obj) { // ###
  bion.encode(obj);
}

function decode(obj) { // ###
  if(typeof obj === 'string') {
    return JSON.parse(obj);
  } else {
    return bion.decode(obj);
  }
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
      ws.send(JSON.stringify({type: 'helo', data: 'me'}));
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


/***/ })
/******/ ]);
//# sourceMappingURL=dist.js.map