// # Sea.js
//
(async function() {

  var url = process.env.URL || 'ws://localhost:8888/';
  var server = require('http').createServer();
  var wss = new (require('ws')).Server({server: server});

  var sockets = [];
  var idlist = [];
  var ids = new Map();

  function rmId(id) {
    var idx = ids.get(id);
    if(idx !== undefined) {
      ids.delete(id);
      if(idx < idlist.length - 1) {
        idlist[idx] = idlist[idlist.length - 1]; idlist.pop();
        sockets[idx] = sockets[sockets.length - 1]; sockets.pop();
        ids.set(idlist[idx], idx);
      }
    }
  }

  wss.on('connection', (ws) => {
    var id;
    ws.on('close', () => {
      rmId(id);
    });
    ws.on('message', (msg) => {
      try {
        var o = JSON.parse(msg);
        switch(o.type) {
          case 'helo':
            id = o.data;
            rmId(id);
            ids.set(id, sockets.length);
            sockets.push(ws);
            idlist.push(id);
            break;
          default:
            if(id && idlist.length > 1) {
              var next;
              if(o.path) {
                next = sockets[ids.get(o.path.pop())]
              } else {
                o.trail = o.trail || [];
                o.trail.push(url);
                do {
                  next = sockets[Math.random() * sockets.length | 0];
                } while(next !== ws);
              }
              next.send(JSON.stringify(o));
            }
        }
        console.log('success', msg);
      } catch(e) {
        console.log('error', e, msg);
      }
    });
  });

  server.listen(8888, () => {
    console.log('started on', server.address().port);
  });
}
})();
