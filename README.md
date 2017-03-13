See <https://sea.solsort.com> for details

# Dev environment

https://github.com/emcrisostomo/fswatch/releases/download/1.9.3/fswatch-1.9.3.tar.gz

# Random Notes
## Milestones

### Bion data serialisation

```
ta = encode({...});
b = bion(ta);
b.getIn(['foo', 12]).toJS();

... 


socket.onmessage = (msg) => {
  if(bion(msg).getIn('dst').toJS() === ...) {
    otherSocket.send(msg)
  } else {
    bion(msg).toJS() ...
  }
}

```

### p2p webrtc create connection

and kademlie-like addressing

### p2p tagging of self, and possibility to search for peers with a given tag

### Immutables on top of bion

- Bion + immutables
- p2p webrtc create-connection
- proxy-server for legacy browsers


## DHT

## Concepts

- unit
    - has a balance of debt to/from other units
    - able to sign digitally
- node (computational unit)
    - has 


- services
    - deliver a message/response
    - do a computation
    - fetch data given hash

## Technologies

- Rust/WebAssembly - access to i64 will make things easier

## Milestones

### Basic running environment


### Connection through Sea
- environment running
- send 
