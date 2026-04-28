# 9. Model Context Protocol (MCP)

Connect to an existing MCP server (filesystem or GitHub) and exercise a tool through a supported client. Same mental model as tool calling — just with a client–server boundary.

## Architecture

Understand the components:

| Component | Role |
|-----------|------|
| **MCP Host** | Your application |
| **MCP Client** | Manages connections |
| **MCP Server** | Exposes tools and resources |
| **Transport Layer** | stdio or HTTP/SSE |

Build at least one MCP server that wraps a capability your agent needs.

!!! tip "When to use MCP"
    MCP makes sense when tools need to be shared across multiple agents or clients. For a single system, in-process tools are simpler.

## Resources

[MCP docs](https://modelcontextprotocol.io/) · [Claude MCP](https://docs.anthropic.com/en/docs/build-with-claude/mcp) · [MCP specification](https://spec.modelcontextprotocol.io/)
