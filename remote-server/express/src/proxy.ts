import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"

interface Session {
  token: string
  startAt: number
  lastActiveAt: number
  webSessionId: string
  sessionId: string
}

export class Proxy {
  private webTransports: Map<string, SSEServerTransport> = new Map()
  private transports: Map<string, SSEServerTransport> = new Map()
  private sessions: Map<string, Session> = new Map()
  private timer: NodeJS.Timeout

  constructor() {
    this.timer = setInterval(() => {
      this.ping()
      // TODO: check timeout
    }, 1000 * 10)
  }

  async webConnect(
    token: string,
    transport: SSEServerTransport,
    renewal: boolean
  ) {
    let session = this.sessions.get(token)
    if (!session && !renewal) {
      session = {
        token,
        startAt: Date.now(),
        lastActiveAt: Date.now(),
        webSessionId: transport.sessionId,
        sessionId: "",
      }
      this.sessions.set(token, session)
    }

    if (!session) {
      throw new Error("timeout")
    }

    session.webSessionId = transport.sessionId
    this.sessions.set(token, session)

    const stale = this.webTransports.get(session.webSessionId)
    if (stale) {
      this.webTransports.delete(stale.sessionId)
      stale.onmessage = undefined
      stale.onerror = undefined
      // close ?
    }

    this.webTransports.set(transport.sessionId, transport)
    transport.onclose = () => {
      this.webTransports.delete(transport.sessionId)
    }

    const toClient = this.getTransport(session.sessionId)
    if (toClient) {
      this.proxy(toClient, transport)
    }

    await transport.start()
  }

  async connect(token: string, transport: SSEServerTransport) {
    const session = this.sessions.get(token)
    if (!session) {
      throw new Error("Session not found")
    }

    const stale = this.transports.get(session.sessionId)
    if (stale) {
      this.transports.delete(stale.sessionId)
      stale.onmessage = undefined
      stale.onerror = undefined
      // close ?
    }
    session.sessionId = transport.sessionId
    this.sessions.set(token, session)

    this.transports.set(transport.sessionId, transport)
    transport.onclose = () => {
      this.transports.delete(transport.sessionId)
    }
    const toWeb = this.getWebTransport(session.webSessionId)
    if (toWeb) {
      this.proxy(transport, toWeb)
    } else {
      console.warn("Web transport not found")
    }

    await transport.start()
  }

  getWebTransport(sessionId: string) {
    return this.webTransports.get(sessionId)
  }

  getTransport(sessionId: string) {
    return this.transports.get(sessionId)
  }

  validateToken(token: string) {
    const session = this.sessions.get(token)
    if (session) {
      return true
    }
    return false
  }

  private proxy(client: SSEServerTransport, web: SSEServerTransport) {
    client.onmessage = (message) => {
      console.log("to web", message, web.sessionId)
      web.send(message).catch((err) => {
        console.error("Error sending message to web:", err)
      })
    }
    web.onmessage = (message) => {
      console.log("to client", message, client.sessionId)
      client.send(message).catch((err) => {
        console.error("Error sending message to client:", err)
      })
    }
  }

  private ping() {
    this.webTransports.forEach((transport) => {
      transport.send({
        jsonrpc: "2.0",
        id: 1,
        method: "ping",
      })
    })

    this.transports.forEach((transport) => {
      transport.send({
        jsonrpc: "2.0",
        id: 1,
        method: "ping",
      })
    })
  }
}
