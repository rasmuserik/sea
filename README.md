# Sea

The intention of sea is to be a core for building distributed web applications.
The goal of Sea is become the distributed computing platform, running peer-to-peer in the webbrowser. 

The initial use case is to make apps with pub-sub and connections, with no backend.

Sea will be built upon, and only run within, modern browser engines. The network stack builds upon WebRTC Data Channels. Computation is done with WebAssembly. This is currently only available in Firefox from version 52 and Chrome from version 57, but the remaining browsers are expected to catch up within the near future. 

Bootstrap servers are electron apps, which allows incoming connections by having an open secure websocket server. Otherwise they are identical to the other peers in the sea. Bootstrap servers are only used to make the initial connection. All other connections are created peer-to-peer through the sea.


## Roadmap / API

- √ bion.encode/bion.decode (update solsort/bion)
- √ HashAddresses
- Connect to Sea
    - `sea = require('peersea')  →   ()`
    - `sea.localId()  →   addr`
    - `sea.connections()  →   Array(addr..)`
    - `sea.goOnline([bootstrapServer])  →   Promise()`
    - `sea.goOffline()  →   Promise()` 
    - `sea.online()  →   Boolean`
    - `sea.on('online', () => ..)  →   ()`
    - `sea.on('offline', () => ..)  →   ()`
- RPC to any node in the network (for making connections etc.)
    - `sea.handle(scope, (args..) => Promise(..))`
    - `sea.call(addr, scope, args..)  →   Promise(..)`
    - `sea.call(addr, 'sea:nearest', addr)  →   Promise(addr)`
- Direct communication between peers
    - `sea.connect(remoteId : addr)  →   con`
    - `sea.on('connection', (con) => ..)  →   ()`
    - `con.remoteId()  →   addr` 
    - `con.disconnect()  →   ()`
    - `con.connected()  →   Boolean`
    - `con.on('connect', () => ..)  →   ()`
    - `con.on('disconnect', () => ..)  →   ()`
    - `con.send(scope, obj)  →   ()`
    - `con.on(scope, (obj) => ..)  →   ()`
- Pubsub
    - `sea.join(channelId)  →   chan`
    - `chan.channelId()`  →   `String` 
    - `chan.disconnect()`
    - `chan.connected()  →   Boolean`
    - `chan.on('connect', () => ..)`
    - `chan.on('disconnect', () => ..)`
    - `chan.send(scope, obj)`
    - `chan.on(scope, (obj) => ..)`

## Notes

Concepts:

- An *entity* has a balance of credit to/from other entities, and is able to add a verifiable signature to data.
- A *node* is a computer(webbrowser/server/smartphone/...) connected to other nodes in the *sea*. A node is a computational *entity*, and can make sigatures via public/private-key cryptography. A node has resources: storage, network, computing power, - and can deliver this as services to other entities. Services can be paid by updating the credit balance between the entities.
- The *sea* is the entire network of online connected nodes.

Long term vision:

- sharing/market of computing resources
- economic system
- shared "clock" with a "tick" each ~10 sec / blockchain with list of all peers, and common accounting
    - secure computations / contracts running on top of the blockchain.
    - storage within the sea
