# Sea

The goal of Sea is become the distributed computing platform, running peer-to-peer in the webbrowser. 

The initial use case is to make apps with pub-sub and connections, with no backend.

Sea will be built upon, and only run within, modern browser engines. The network stack builds upon WebRTC Data Channels. Computation is done with WebAssembly. This is currently only available in Firefox from version 52 and Chrome from version 57, but the remaining browsers are expected to catch up within the near future. 

Bootstrap servers are electron apps, which allows incoming connections by having an open secure websocket server. Otherwise they are identical to the other peers in the sea. Bootstrap servers are only used to make the initial connection. All other connections are created peer-to-peer through the sea.


## Intended API

***Under development***

Public API:

- `sea.addr(secret) →  addr` Public address, given a channel id.
- `sea.send(addr, name, msg)` sends a message to a channel
- `sea.secret` secret/channel-address for this node only. Join to receive messages.
- `sea.join(secret) →  chan` connect/create/join a channel (notice, keeps connections open to other nodes in the channel, and regularly broadcast membership to the network, which takes some bandwidth)
    - `chan.on(name, fn)` handle incoming messages. `sea.send(sea.addr(secret), name, msg)` end up at `sea.join(secret).on(name, fn)`
    - `chan.leave()` disconnect from a channel.
    - `chan.rejoin()` reconnect to channel after leave has been called.
    - `chan.send(name, msg)` same as `sea.send(sea.addr(secret), name, msg)`
    - `chan.exportFn(name, fn)` same as `chan.on` + send result possibly async fn to `{dst: msg.reply, name: msg.replyName, ...}`
- `sea.call(addr, name, msg) →  Promise` - same as create a temporary endpoint with a `random_name` on `sea.incoming` and send `{reply: local.id, replyName: random_name, ...msg}`.
- `sea.id` - same as to `sea.addr(sea.secret)`
- `sea.incoming` - result of `sea.join(sea.secret)`

Public message properties:

- `name` target mailbox
- `dst` target address
- `src` original sender
- `ts` sending timestamp for message, based on local estimated/median clock.
- `data` actual data
- `error` error
- `reply` address to reply to
- `replyName` name/mailbox to reply to
- `multicast` true if the message should be send to all nodes in the channel

## Roadmap / API

- √Websocket bootstrap gateway
- √Establish webrtc through neighbours
- Propagate connection state to neighbours
- Iteratively connect to nodes nearest to routing points.
- Routing across network
- Tagging / DHT with short TTL, and nodes as values
- Multicast
- Keep track of number open channels, and disconnect from network if they reach zero / reconnect if above zero.

Menial tasks
- refactor addresses to be base64 strings.
- apply handshake on webrtc connections.

Later: Economic system, DHT, Groups / broadcast, ticktock, Blockchain

### Connection data structure

```yaml
- id: "c2FtcGxl.."
  connected: true
  pubkey: "UHViS2V5..."
  send: Function
  on: event-handler: message
  latency: 123
  connections:
    - id: "Rmlyc3Q...":
      pubkey: "Zmlyc3Q..."
      latency: 123
    - id: "U2Vjb25k..."
      pubkey: "c2Vjb25k..."
      latency: 123
```


### General Concepts

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
