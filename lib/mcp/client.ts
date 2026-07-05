/**
 * MCP (Model Context Protocol) client for communicating with
 * Easy MCP AI and other MCP-compatible WordPress servers.
 *
 * Uses JSON-RPC 2.0 over HTTP with Bearer token auth.
 */

export type McpToolResult = {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

export type McpCallOptions = {
  endpoint: string;
  token: string;
};

let _requestId = 0;

function nextId() {
  return ++_requestId;
}

async function sendRequest<T = unknown>(
  endpoint: string,
  token: string,
  method: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const body = {
    jsonrpc: "2.0",
    id: nextId(),
    method,
    ...(params ? { params } : {}),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MCP request failed (${response.status}): ${text}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  // Handle SSE response (text/event-stream)
  if (contentType.includes("text/event-stream")) {
    const text = await response.text();
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));
        if (data.error) {
          throw new Error(`MCP error: ${data.error.message ?? JSON.stringify(data.error)}`);
        }
        return data.result as T;
      }
    }
    throw new Error("MCP SSE response contained no data events");
  }

  // Handle regular JSON response
  const json = await response.json();
  if (json.error) {
    throw new Error(`MCP error: ${json.error.message ?? JSON.stringify(json.error)}`);
  }
  return json.result as T;
}

/**
 * List all available tools on the MCP server.
 */
export async function listTools(options: McpCallOptions) {
  return sendRequest<{ tools: Array<{ name: string; description?: string; inputSchema?: unknown }> }>(
    options.endpoint,
    options.token,
    "tools/list",
  );
}

/**
 * Call a specific tool on the MCP server.
 */
export async function callTool(
  options: McpCallOptions,
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<McpToolResult> {
  return sendRequest<McpToolResult>(options.endpoint, options.token, "tools/call", {
    name: toolName,
    arguments: args,
  });
}

/**
 * Initialize MCP session (required by some servers).
 */
export async function initialize(options: McpCallOptions) {
  return sendRequest(
    options.endpoint,
    options.token,
    "initialize",
    {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "publisherpilot", version: "0.1.0" },
    },
  );
}

/**
 * Extract text content from an MCP tool result.
 */
export function extractText(result: McpToolResult): string {
  return result.content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!)
    .join("\n");
}

/**
 * Parse JSON from an MCP tool result (tries to extract JSON from text content).
 */
export function extractJson<T = unknown>(result: McpToolResult): T | null {
  const text = extractText(result);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try to find JSON in the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
