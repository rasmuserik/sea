// # Sea.js
//
let EventEmitter = require('events');
let HashAddress = require('hashaddress');
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
  return HashAddress.fromHex(s1).dist(HashAddress.fromHex(s2));
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
  return (await HashAddress.generate(publicKey)).toHex();
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

