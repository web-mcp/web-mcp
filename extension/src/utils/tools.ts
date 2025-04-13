import { CallToolResult } from "@modelcontextprotocol/sdk/types.js"

export function TextResult(text: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: text,
      },
    ],
  }
}
