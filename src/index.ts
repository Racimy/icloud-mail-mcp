#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { iCloudMailClient } from "./lib/icloud-mail-client.js";
import { iCloudConfig } from "./types/config.js";

const server = new Server(
  {
    name: "icloud-mail-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let mailClient: iCloudMailClient | null = null;

// Initialize with environment variables if available
async function initializeFromEnv() {
  if (process.env.ICLOUD_EMAIL && process.env.ICLOUD_APP_PASSWORD) {
    const config: iCloudConfig = {
      email: process.env.ICLOUD_EMAIL,
      appPassword: process.env.ICLOUD_APP_PASSWORD,
      imapHost: "imap.mail.me.com",
      imapPort: 993,
      smtpHost: "smtp.mail.me.com",
      smtpPort: 587,
    };

    try {
      mailClient = new iCloudMailClient(config);
      await mailClient.connect();
      console.error(`Auto-configured iCloud Mail for ${config.email}`);
    } catch (error) {
      console.error("Failed to auto-configure iCloud Mail:", error);
      mailClient = null;
    }
  }
}

// Initialize on startup
initializeFromEnv();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "configure_icloud",
        description: "Configure iCloud email account with App Password",
        inputSchema: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "Your iCloud email address",
            },
            appPassword: {
              type: "string",
              description: "App-specific password for iCloud Mail",
            },
          },
          required: ["email", "appPassword"],
        },
      },
      {
        name: "get_messages",
        description: "Get email messages from specified mailbox",
        inputSchema: {
          type: "object",
          properties: {
            mailbox: {
              type: "string",
              description: "Mailbox name (default: INBOX)",
              default: "INBOX",
            },
            limit: {
              type: "number",
              description: "Maximum number of messages to retrieve",
              default: 10,
            },
            unreadOnly: {
              type: "boolean",
              description: "Retrieve only unread messages",
              default: false,
            },
          },
        },
      },
      {
        name: "send_email",
        description: "Send an email through iCloud Mail",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              oneOf: [
                { type: "string" },
                { type: "array", items: { type: "string" } },
              ],
              description: "Recipient email address(es)",
            },
            subject: {
              type: "string",
              description: "Email subject",
            },
            text: {
              type: "string",
              description: "Plain text email body",
            },
            html: {
              type: "string",
              description: "HTML email body",
            },
          },
          required: ["to", "subject"],
        },
      },
      {
        name: "mark_as_read",
        description: "Mark email messages as read",
        inputSchema: {
          type: "object",
          properties: {
            messageIds: {
              type: "array",
              items: { type: "string" },
              description: "Array of message IDs to mark as read",
            },
            mailbox: {
              type: "string",
              description: "Mailbox name (default: INBOX)",
              default: "INBOX",
            },
          },
          required: ["messageIds"],
        },
      },
      {
        name: "get_mailboxes",
        description: "List all available mailboxes",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "test_connection",
        description: "Test the email server connection (IMAP and SMTP)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_mailbox",
        description: "Create a new mailbox (folder)",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the mailbox to create",
            },
          },
          required: ["name"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "configure_icloud": {
        const config: iCloudConfig = {
          email: args?.email as string,
          appPassword: args?.appPassword as string,
          imapHost: "imap.mail.me.com",
          imapPort: 993,
          smtpHost: "smtp.mail.me.com",
          smtpPort: 587,
        };

        mailClient = new iCloudMailClient(config);
        await mailClient.connect();

        return {
          content: [
            {
              type: "text",
              text: `Successfully configured iCloud Mail for ${config.email}`,
            },
          ],
        };
      }

      case "get_messages": {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            "iCloud Mail not configured. Use configure_icloud first."
          );
        }

        const mailbox = (args?.mailbox as string) || "INBOX";
        const limit = (args?.limit as number) || 10;
        const unreadOnly = (args?.unreadOnly as boolean) || false;

        const messages = await mailClient.getMessages(
          mailbox,
          limit,
          unreadOnly
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(messages, null, 2),
            },
          ],
        };
      }

      case "send_email": {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            "iCloud Mail not configured. Use configure_icloud first."
          );
        }

        const result = await mailClient.sendEmail({
          to: args?.to as string | string[],
          subject: args?.subject as string,
          text: args?.text as string,
          html: args?.html as string,
        });

        return {
          content: [
            {
              type: "text",
              text: `Email sent successfully. Message ID: ${result.messageId}`,
            },
          ],
        };
      }

      case "mark_as_read": {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            "iCloud Mail not configured. Use configure_icloud first."
          );
        }

        const messageIds = args?.messageIds as string[];
        const mailbox = (args?.mailbox as string) || "INBOX";

        await mailClient.markAsRead(messageIds, mailbox);

        return {
          content: [
            {
              type: "text",
              text: `Marked ${messageIds.length} messages as read`,
            },
          ],
        };
      }

      case "get_mailboxes": {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            "iCloud Mail not configured. Use configure_icloud first."
          );
        }

        const mailboxes = await mailClient.getMailboxes();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(mailboxes, null, 2),
            },
          ],
        };
      }

      case "test_connection": {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            "iCloud Mail not configured. Use configure_icloud first."
          );
        }

        const result = await mailClient.testConnection();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_mailbox": {
        if (!mailClient) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            "iCloud Mail not configured. Use configure_icloud first."
          );
        }

        const mailboxName = args?.name as string;
        const result = await mailClient.createMailbox(mailboxName);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool ${name}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("iCloud Mail MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
