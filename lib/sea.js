// # Sea.js
//
(async function() {
  var cbor = require('cbor-js');

  var key = await crypto.subtle.generateKey({
    name: 'ECDSA', 
    namedCurve: 'P-521'
  }, true, ['sign', 'verify']);
  var publicKey = await crypto.subtle.exportKey('spki', key.publicKey);
  var id = await crypto.subtle.digest('SHA-256', publicKey);

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
})();
(async () => {

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

if(self.node_modules) {
  var server = node_modules.http.createServer();
  var wss = new node_modules.ws.Server({server: server});

  var sockets = {};
  wss.on('connection', (ws) => {
    var id = Math.random().toString(36).slice(2,12);
    ws.send(JSON.stringify({
      mbox: 'welcome',
      id: id,
      peers: Object.keys(sockets)
    }));
    sockets[id] = ws;
    ws.on('message', (msg) => {
      var o = JSON.parse(msg);
      if(sockets[o.dst]) {
        sockets[o.dst].send(msg);
      } 
      console.log(msg);
    });
  });

  server.listen(8888, () => {
    console.log('started on port ' + server.address().port);
  });
}
