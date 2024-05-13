# Use with websocket
When sharing events between your opened tabs is not enough, and you need to propagate your events to other devices and even users, you can easily do this with websockets/socket.io/firebase


## socket.io
You need a socket.io server.

Define the bus:
```ts
type Pools = 'Tasks' | 'Users' | ''
const Events: EventBusType<{
  [key in `updated:${Pools}`]: unknown
}> = Symbol("Event bus")
```

```ts
import { useGlobalEventBus } from "./index";

const socket = io();
const bus = useGlobalEventBus(Events);

socket.on("message", (eventName: keyof Events, payload: any) => {
  bus.emit('eventName', payload);
})

```
