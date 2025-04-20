export const enum InvokerFunc {
  PingContent = "ping-content",
  Connect = "connect",
  Disconnect = "disconnect",
  GetConnectionState = "get-connection-state",
  ConnectionState = "connection-state",
  CallTools = "call-tools",
}

export const enum Connection {
  Disconnected = "disconnected",
  Connecting = "connecting",
  Connected = "connected",
}

export type SessionState = {
  connection: Connection
  serverUrl: string
}

export const enum ContextMenuId {
  Dev = "dev",
}
