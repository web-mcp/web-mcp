import {
  JSONRPCMessage,
  JSONRPCMessageSchema,
} from "@modelcontextprotocol/sdk/types.js" // Adjust path as necessary
import {
  Transport,
  type TransportSendOptions,
} from "@modelcontextprotocol/sdk/shared/transport.js" // Adjust path as necessary
import { type AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js" // Adjust path as necessary
import { randomUUID } from "@/utils/util" // Adjust path as necessary

// Assuming auth-related types and functions are available, similar to SSEClientTransport
// You might need to import/define these if they are not globally available or in a shared module.
// For this example, let's assume they are in a similar location as in SSEClientTransport.
import {
  type OAuthClientProvider,
  auth,
  AuthResult,
  UnauthorizedError,
} from "@modelcontextprotocol/sdk/client/auth.js" // Adjust path as necessary

/**
 * Custom error class for WebSocket transport specific errors.
 */
export class WsError extends Error {
  constructor(message: string, public readonly event?: Event | CloseEvent) {
    super(message)
    this.name = "WsError"
  }
}

/**
 * Configuration options for the `WsClientTransport`.
 */
export type WsClientTransportOptions = {
  /**
   * An OAuth client provider to use for authentication.
   * If provided, an attempt will be made to acquire an access token
   * which will be appended as a query parameter to the WebSocket URL.
   */
  authProvider?: OAuthClientProvider

  /**
   * The name of the query parameter used to send the access token.
   * Defaults to "access_token".
   */
  tokenQueryParamName?: string

  /**
   * WebSocket subprotocols.
   */
  protocols?: string | string[]

  /**
   * Optional: The number of milliseconds to wait for a connection to open before timing out.
   * If not provided, it will wait indefinitely (or until the browser/OS times out).
   */
  connectionTimeout?: number
}

/**
 * Client transport for WebSockets: this will connect to a server using a WebSocket
 * for bidirectional JSON-RPC message exchange.
 */
export class WsClientTransport implements Transport {
  private _websocket: WebSocket | null = null
  private _url: URL
  private _protocols?: string | string[]
  private _authProvider?: OAuthClientProvider
  private _tokenQueryParamName: string
  private _connectionTimeout?: number

  // To prevent multiple concurrent start attempts and to handle promise resolution/rejection
  private _connectionPromise: Promise<void> | null = null
  private _resolveConnectionPromise: (() => void) | null = null
  private _rejectConnectionPromise: ((reason?: any) => void) | null = null

  public sessionId: string
  public onclose?: () => void
  public onerror?: (error: Error) => void
  public onmessage?: (
    message: JSONRPCMessage,
    extra?: { authInfo?: AuthInfo }
  ) => void

  constructor(url: string | URL, options?: WsClientTransportOptions) {
    const rawUrl = url.toString()
    if (!rawUrl.startsWith("ws://") && !rawUrl.startsWith("wss://")) {
      throw new Error(
        `Invalid WebSocket URL: "${rawUrl}". Must start with "ws://" or "wss://".`
      )
    }
    this._url = new URL(rawUrl)
    this.sessionId = randomUUID()
    this._protocols = options?.protocols
    this._authProvider = options?.authProvider
    this._tokenQueryParamName = options?.tokenQueryParamName || "access_token"
    this._connectionTimeout = options?.connectionTimeout
  }

  private async _getAuthenticatedUrl(): Promise<URL> {
    const url = new URL(this._url.toString()) // Create a new URL object to avoid modifying the original

    if (this._authProvider) {
      let authResult: AuthResult
      try {
        // Attempt to get token or trigger auth flow if necessary
        authResult = await auth(this._authProvider, { serverUrl: this._url })
      } catch (error) {
        this.onerror?.(error as Error)
        throw error // Propagate error to stop connection attempt
      }

      if (authResult !== "AUTHORIZED") {
        // This case implies redirection might have been initiated by `auth` or auth is pending.
        // For WebSockets, we typically need the token upfront.
        const err = new UnauthorizedError(
          "Authorization required and not completed before WebSocket connection."
        )
        this.onerror?.(err)
        throw err
      }

      // If AUTHORIZED, an access token should be available
      const tokens = await this._authProvider.tokens()
      if (tokens?.access_token) {
        url.searchParams.set(this._tokenQueryParamName, tokens.access_token)
      } else {
        // This state should ideally not be reached if authResult was "AUTHORIZED"
        const err = new UnauthorizedError(
          "Access token not available after authorization."
        )
        this.onerror?.(err)
        throw err
      }
    }
    return url
  }

  async start(): Promise<void> {
    if (this._websocket && this._websocket.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    // If a connection attempt is already in progress, return its promise
    if (this._connectionPromise) {
      return this._connectionPromise
    }

    // Create a new promise for this connection attempt
    this._connectionPromise = new Promise<void>((resolve, reject) => {
      this._resolveConnectionPromise = resolve
      this._rejectConnectionPromise = reject
    })

    let connectionTimeoutId: NodeJS.Timeout | number | undefined

    try {
      const finalUrl = await this._getAuthenticatedUrl()
      this._websocket = new WebSocket(finalUrl.toString(), this._protocols)

      if (this._connectionTimeout && this._connectionTimeout > 0) {
        connectionTimeoutId = setTimeout(() => {
          const error = new WsError(
            `WebSocket connection timed out after ${this._connectionTimeout}ms`
          )
          // Manually close the WebSocket if it's still trying to connect
          if (
            this._websocket &&
            this._websocket.readyState === WebSocket.CONNECTING
          ) {
            this._websocket.close(3000, "Connection Timeout") // Custom close code for timeout
          }
          // Note: this._websocket.onclose will handle cleanup and promise rejection.
          // If onclose isn't triggered quickly, we might need to directly reject here.
          // However, WebSocket.close() should trigger onclose.
          // If it's already open or closed, this timeout error is less relevant.
          if (this._rejectConnectionPromise) {
            this._rejectConnectionPromise(error)
          } else {
            this.onerror?.(error) // Fallback if promise handlers are already cleared
          }
          this._cleanupConnectionAttempt()
        }, this._connectionTimeout)
      }

      this._websocket.onopen = () => {
        if (connectionTimeoutId) clearTimeout(connectionTimeoutId as any)
        this._resolveConnectionPromise?.()
        // Do not cleanup promise handlers here, let close/error handle final state
      }

      this._websocket.onmessage = (event: MessageEvent) => {
        let message: JSONRPCMessage
        try {
          if (typeof event.data !== "string") {
            throw new Error("Received non-string WebSocket message.")
          }
          const parsedData = JSON.parse(event.data)
          message = JSONRPCMessageSchema.parse(parsedData)
        } catch (error) {
          this.onerror?.(
            new WsError(
              `Error parsing message: ${(error as Error).message}`,
              event
            )
          )
          return
        }
        // The `extra.authInfo` is typically more relevant for server-side transports
        // or for protocols that embed auth info per message. For basic client WebSockets,
        // authentication is usually at the connection level.
        this.onmessage?.(message, { authInfo: undefined })
      }

      this._websocket.onerror = (event: Event) => {
        if (connectionTimeoutId) clearTimeout(connectionTimeoutId as any)
        const error = new WsError("WebSocket error", event)
        this.onerror?.(error)
        this._rejectConnectionPromise?.(error)
        this._cleanupConnectionAttempt() // Ensure cleanup
        // The 'onclose' event will likely follow, which will also call onclose if defined.
      }

      this._websocket.onclose = (event: CloseEvent) => {
        if (connectionTimeoutId) clearTimeout(connectionTimeoutId as any)
        // If the connection was not opened successfully, and we are closing, reject the promise.
        // This handles cases where close happens before open (e.g. server rejects connection).
        if (
          this._websocket &&
          this._websocket.readyState !== WebSocket.OPEN &&
          this._rejectConnectionPromise
        ) {
          const reason = event.wasClean
            ? `Connection closed cleanly (Code: ${event.code}, Reason: ${event.reason})`
            : `Connection closed unexpectedly (Code: ${event.code}, Reason: ${event.reason})`
          const error = new WsError(
            `WebSocket closed before opening. ${reason}`,
            event
          )
          this._rejectConnectionPromise(error)
        }

        this.onclose?.()
        this._cleanupConnectionAttempt()
        this._websocket = null // Important: clear the instance
      }
    } catch (error) {
      // This catches errors from _getAuthenticatedUrl or WebSocket constructor
      if (connectionTimeoutId) clearTimeout(connectionTimeoutId as any)
      this.onerror?.(error as Error)
      this._rejectConnectionPromise?.(error as Error)
      this._cleanupConnectionAttempt()
    }
    return this._connectionPromise
  }

  private _cleanupConnectionAttempt(): void {
    this._connectionPromise = null
    this._resolveConnectionPromise = null
    this._rejectConnectionPromise = null
  }

  /**
   * Call this method after an OAuth redirect flow has completed (if applicable for your authProvider).
   * This method helps the authProvider exchange an authorization code for tokens.
   * Subsequent calls to `start()` should then succeed with authentication.
   */
  async finishAuth(authorizationCode: string): Promise<void> {
    if (!this._authProvider) {
      throw new UnauthorizedError("No auth provider configured for finishAuth.")
    }
    const result = await auth(this._authProvider, {
      serverUrl: this._url,
      authorizationCode,
    })
    if (result !== "AUTHORIZED") {
      throw new UnauthorizedError(
        "Failed to complete authorization process with the provided code."
      )
    }
    // Tokens should now be stored by the authProvider.
    // The next call to start() will use these new tokens.
  }

  async send(
    message: JSONRPCMessage,
    _options?: TransportSendOptions // options not directly used by WebSocket.send but part of interface
  ): Promise<void> {
    if (!this._websocket || this._websocket.readyState !== WebSocket.OPEN) {
      const error = new WsError("WebSocket not connected or not open.")
      this.onerror?.(error)
      return Promise.reject(error) // Return a rejected promise
    }

    try {
      this._websocket.send(JSON.stringify(message))
      return Promise.resolve()
    } catch (error) {
      this.onerror?.(error as Error)
      return Promise.reject(error) // Return a rejected promise
    }
  }

  async close(): Promise<void> {
    // If there's an ongoing connection attempt, we might want to signal it to stop.
    // However, WebSocket API doesn't have a direct abort for connection.
    // Calling close on a CONNECTING socket will trigger its onclose/onerror.
    if (this._rejectConnectionPromise) {
      this._rejectConnectionPromise(
        new WsError(
          "Connection explicitly closed by client during connection attempt."
        )
      )
    }
    this._cleanupConnectionAttempt() // Clear any pending connection promises immediately

    if (this._websocket) {
      if (
        this._websocket.readyState === WebSocket.OPEN ||
        this._websocket.readyState === WebSocket.CONNECTING
      ) {
        this._websocket.close()
      }
      // The actual onclose callback and nullifying _websocket is handled by the 'onclose' event listener.
    }
    // The Transport interface expects close() to return a Promise<void>.
    // This promise resolves when the close operation is initiated.
    // The actual closing is asynchronous and will trigger the `onclose` callback.
    return Promise.resolve()
  }
}
