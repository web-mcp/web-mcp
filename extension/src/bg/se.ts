import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { createMCPServer } from "./mcp";
import { Subject, from, interval, merge, defer, ReplaySubject } from "rxjs";
import { takeUntil, switchMap, tap, scan, startWith } from "rxjs/operators";

export class Session {
  private url: URL;
  private token: string;
  private server: McpServer;
  private transport: SSEClientTransport;
  
  // RxJS Subjects
  private disconnect$ = new Subject<void>();
  private message$ = new Subject<JSONRPCMessage>();
  private error$ = new Subject<Error>();
  private sentMessage$ = new Subject<JSONRPCMessage>();
  
  // State streams
  private isConnected$ = new ReplaySubject<boolean>(1);
  private receivedMessages$ = this.message$.pipe(
    scan((acc, message) => [...acc, message], [] as JSONRPCMessage[])
  );
  private sentMessages$ = this.sentMessage$.pipe(
    scan((acc, message) => [...acc, message], [] as JSONRPCMessage[])
  );
  private errors$ = this.error$.pipe(
    scan((acc, error) => [...acc, error], [] as Error[])
  );

  constructor() {
    // Setup periodic logging
    this.setupLogging();
  }

  async connect(proxyUrl: string, token: string) {
    if (!token || !proxyUrl) {
      throw new Error("Invalid token or url");
    }

    if (this.transport) {
      throw new Error("Session already connected.");
    }

    const u = new URL(proxyUrl);
    u.searchParams.set("token", token);

    this.token = token;
    this.url = u;
    this.transport = new SSEClientTransport(u, {});
    this.server = createMCPServer();
    
    // Wrap connection in Observable
    await from(this.server.connect(this.transport)).toPromise();
    
    this.interceptTransport();
    this.isConnected$.next(true);
    
    return this.getState();
  }

  async disconnect() {
    this.isConnected$.next(false);
    this.disconnect$.next();
    
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }
  }

  async getState() {
    const serverUrl = this.url.origin + "/sse" + "?token=" + this.token;
    return {
      isConnected: await this.isConnected$.pipe(takeUntil(this.disconnect$)).toPromise(),
      serverUrl,
    };
  }

  private interceptTransport() {
    const { onmessage, onclose, onerror, send } = this.transport;

    // Wrap native events into Observables
    this.transport.onmessage = (message) => {
      onmessage?.(message);
      this.message$.next(message);
    };

    this.transport.onerror = (error) => {
      onerror?.(error);
      this.error$.next(error);
    };

    this.transport.onclose = () => {
      onclose?.();
      this.disconnect();
    };

    // Wrap send method with Observable
    this.transport.send = async (message) => {
      await send.call(this.transport, message);
      this.sentMessage$.next(message);
    };
  }

  private setupLogging() {
    // Combine all state streams
    const state$ = merge(
      this.receivedMessages$,
      this.sentMessages$,
      this.errors$
    ).pipe(
      startWith(null),
      switchMap(() =>
        combineLatest([
          this.receivedMessages$,
          this.sentMessages$,
          this.errors$,
        ])
      )
    );

    // Periodic logging
    interval(5000)
      .pipe(
        takeUntil(this.disconnect$),
        switchMap(() => state$)
      )
      .subscribe(([received, sent, errors]) => {
        console.log("messages", received);
        console.log("sents", sent);
        console.log("errors", errors);
      });
  }
}

export const session = new Session();