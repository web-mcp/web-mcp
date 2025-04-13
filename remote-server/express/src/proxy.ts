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

  constructor() {}

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

    this.webTransports.set(transport.sessionId, transport)

    const toClient = this.getTransport(session.sessionId)
    if (toClient) {
      this.proxy(toClient, transport)
    }

    await transport.start()

    // setInterval(() => {
    //   transport.send({
    //     method: "ping",
    //     jsonrpc: "2.0",
    //     id: 1,
    //   })
    // }, 3000)
  }

  async connect(token: string, transport: SSEServerTransport) {
    const session = this.sessions.get(token)
    if (!session) {
      throw new Error("Session not found")
    }

    session.sessionId = transport.sessionId
    this.sessions.set(token, session)

    this.transports.set(transport.sessionId, transport)
    const toWeb = this.getWebTransport(session.webSessionId)
    if (toWeb) {
      this.proxy(transport, toWeb)
    } else {
      console.warn("Web transport not found")
    }

    await transport.start()

    // setInterval(() => {
    //   transport.send({
    //     method: "ping",
    //     jsonrpc: "2.0",
    //     id: 1,
    //   })
    // }, 3000)
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
}
