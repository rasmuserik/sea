// # Sea.js
let EventEmitter = require('events');
let bion= require('bion');
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
