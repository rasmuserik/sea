// # Sea.js
//
let EventEmitter = require('events');
let HashAddress = require('hashaddress');
//let bion = require('bion');
let sea = new EventEmitter();
sea.net = new EventEmitter();
let publicKey;
module.exports = sea;

var cons = {};
var connecting = {};

main();
var iceServers; // ##
// Stun server list from https://gist.github.com/zziuni/3741933 
iceServers = ['stun.l.google.com:19302', 'stun1.l.google.com:19302',
           'stun2.l.google.com:19302', 'stun3.l.google.com:19302',
           'stun4.l.google.com:19302', 'stun01.sipphone.com', 'stun.ekiga.net',
           'stun.fwdnet.net', 'stun.ideasip.com', 'stun.iptel.org',
           'stun.rixtelecom.se', 'stun.schlund.de', 'stunserver.org',
           'stun.softjoys.com', 'stun.voiparound.com', 'stun.voipbuster.com',
           'stun.voipstunt.com', 'stun.voxgratia.org', 'stun.xten.com'];
iceServers = iceServers.map(s => ({url: 'stun:' + s}));
function hashDist(s1, s2) { // ##
  return HashAddress.fromHex(s1).dist(HashAddress.fromHex(s2));
}

let slice = (o, a, b) => Array.prototype.slice.call(o, a, b);
let randomId = () => Math.random().toString(36).slice(2,10);
let timeout = 5000;
let findMin = (arr, f) => { // ##
  arr = arr || [];
  let min = arr[0];
  for(let i = 1; i < arr.length; ++i) {
    if(f(arr[i]) < f(min)) {
      min = arr[i];
    }
  }
  return min;
}

exportFn('call', call); // ##

function call(dst, type) { // ##
  let args = slice(arguments, 2);
  console.log('call ' + type, dst, type, args, arguments);
  return new Promise((resolve, reject) => {
    let id = randomId();
    sea.net.once(id, msg => msg.error ? reject(msg.error) : resolve(msg.data));
    setTimeout(() => sea.net.emit(id, {error: 'timeout'}), timeout);
    relay({dst, type, src: sea.id, srcType: id, data: args});
  });
}

function exportFn(name, f) { // ##
  sea.net.on(name, async (msg) => {
    let response = { type: msg.srcType, dst: msg.src };
    try {
      response.data = await f.apply(f, msg.data);
    } catch(e) {
      response.error = String(e);
    }
    relay(response);
  });
}

function relay(msg) { // ##
  console.log('relay ' + msg.dst.slice(0,8) + ' ' + msg.type);
  let con = findMin(Object.values(cons), o => hashDist(o.id, msg.dst));
  if(hashDist(con.id, msg.dst) < hashDist(sea.id, msg.dst)) {
    con.con.send(msg)
  } else {
    console.log('dropped', msg.type, msg.dst);
  }
}
sea.on('connect:socket', (con, resolve) => { // ##
  con.send({
    type: 'helo',
    id: sea.id,
    peers: Object.keys(cons)
  });
  var id;
  con.once('message', async (msg) => {
    id = msg.id;
    cons[id] = {
      id: id, 
      con: con, 
      peers: msg.peers,
      peerUpdate: Date.now(),
    };
    con.on('message', (msg) => {
      if(sea.id === msg.dst || msg.runHere) {
        sea.net.emit(msg.type, msg);
      } else {
        relay(msg);
      }
    });
    console.log('Connected to ' + id);
    if(resolve) {
      resolve();
    }
  });
  con.on('close', () => {
    console.log('disconnect', id);
    delete cons[id];
  });
});

async function main() { // ##
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
        console.log('error', e);
        await sleep(1000);
      }
    }
  }
}
async function connectVia(a, id) { // ##
  let con = new RTCPeerConnection({ 'iceServers': iceServers });
  con.onicecandidate = (e) => {
    console.log('onicecandidata', e);
    if(e.candidate) {
    }
  }
  let chan = con.createDataChannel("sendChannel", { ordered: false });
  let offer = await con.createOffer();
  await con.setLocalDescription(offer);
  con.ondatachannel = (e) => {
    console.log('ondatachannel', e);
    e.channel.send('hi');
  };
  con.onerror = (e) => {
    console.log('err1', e);
  }
  let answer = await call(a, 'call', id, 'webrtc-offer', sea.id, con.localDescription);
  console.log('got answer:', answer);
  con.setRemoteDescription(answer);
  connecting[id] = {id, con, offer, chan}
}
exportFn('webrtc-offer', async (id, offer) => { // ##
  console.log('webrtc-offer', id, offer);
  con = new RTCPeerConnection();
  con.ondatachannel = (o) => {
    console.log('ondatachannel2', o);
  };
  con.onicecandidate = (o) => {
    console.log('onicecandidate2', o);
  };
  con.onerror = (e) => {
    console.log('err2', e);
  }
  await con.setRemoteDescription(offer);
  let answer = await con.createAnswer();
  con.setLocalDescription(answer);
  console.log('answer', answer);
  connecting[id] = { id, con, offer };
  return answer;
});

async function goOnline() { // ##
  await connectToWs('ws://localhost:8888/');
  let done = false;
  //do {
  let a = findMin(Object.keys(cons), o => hashDist(sea.id, o));
  console.log('a', a);
  let b = findMin(cons[a].peers,  o => hashDist(sea.id, o));
  console.log('b', b);
  if(!b || hashDist(sea.id, a) < hashDist(sea.id, b)) {
    done = true;
  } else {
    await connectVia(a, b);
  }
  //  } while(!done);
}

async function generateId() { // ##
  let key = await crypto.subtle.generateKey({
    name: 'ECDSA', 
    namedCurve: 'P-521'
  }, true, ['sign', 'verify']);
  publicKey = await crypto.subtle.exportKey('spki', key.publicKey);
  sea.id = (await HashAddress.generate(publicKey)).toHex();
  sea.emit('ready');
  console.log('My id: ' + sea.id);
  if(self.info) {
    self.info.innerHTML = sea.id;
  }
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
      sea.emit('connect:socket', con, resolve);
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

// # Old
(async function() { // ##


  if(self.node_modules) {
  } else { // isBrowser
    setTimeout(browserMain, 200 + 200 * Math.random());
  }

  function print(s) {
    document.body.innerHTML += s;
  }

  async function browserMainX() { // ##
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
  async function browserMain() { // ##
    console.log('browser'); // ###
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

    var connections = self.cons = {};
    var chans = self.chans = {};

    function setupChan(chan, target) { // ###
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

    function getCon(target, createChan) { // ###
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

    async function connect(msg) { // ###
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
(async () => { // ##

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
