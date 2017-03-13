self.WebSocketServer = async () => {
  var sea = require('./sea');

  var server = require('http').createServer();
  var wss = new (require('ws')).Server({server: server});

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
    console.log('started on', server.address().port);
  });
}
