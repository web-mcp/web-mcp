import express from "express"
import cors from "cors"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import { Proxy } from "./proxy"

const app = express()
app.use(cors())

const proxy = new Proxy()

app.get("/web/sse", async (req, res) => {
  try {
    const token = req.query.token
    const renewal = req.query.renewal

    if (!token || typeof token !== "string") {
      res.status(400).end("Token is required")
      return
    }

    const transport = new SSEServerTransport("/web/message", res)
    proxy.webConnect(token, transport, !!renewal)

    console.log("/web/sse", transport.sessionId)
  } catch (error) {
    console.error("Error in /server/sse route:", error)
    res.status(500).json(error)
  }
})

app.post("/web/message", async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string
    const transport = proxy.getWebTransport(sessionId)
    if (!transport) {
      res.status(404).end("Session not found")
      return
    }
    await transport.handlePostMessage(req, res)
  } catch (error) {
    console.error("Error in /server/message route:", error)
    res.status(500).json(error)
  }
})

app.get(["/sse", "/sse/:token"], async (req, res) => {
  try {
    const token = req.query.token || req.params.token
    if (!token || typeof token !== "string") {
      res.status(400).end("Token is required")
      return
    }

    if (!proxy.validateToken(token)) {
      res.status(400).end("Token is invalid")
      return
    }

    const transport = new SSEServerTransport("/message", res)
    proxy.connect(token, transport)

    // console.log("/sse", transport.sessionId)
  } catch (error) {
    console.error("Error in /sse route:", error)
    res.status(500).json(error)
  }
})

app.post("/message", async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string
    console.log(`Received message for sessionId ${sessionId}`)
    const transport = proxy.getTransport(sessionId)
    if (!transport) {
      res.status(404).end("Session not found")
      return
    }
    await transport.handlePostMessage(req, res)
  } catch (error) {
    console.error("Error in /message route:", error)
    res.status(500).json(error)
  }
})

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  })
})

app.get("/test", async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  })

  const relativeUrlWithSession = "/message?"
  res.write(`event: endpoint\ndata: ${relativeUrlWithSession}\n\n`)
})

const PORT = process.env.PORT || 6288

const server = app.listen(PORT)
server.on("listening", () => {
  console.log(`⚙️ Proxy server listening on port ${PORT}`)
})
server.on("error", (err) => {
  if (err.message.includes(`EADDRINUSE`)) {
    console.error(`❌  Proxy Server PORT IS IN USE at port ${PORT} ❌ `)
  } else {
    console.error(err.message)
  }
  process.exit(1)
})
