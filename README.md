# iCloud Mail MCP Server

A Model Context Protocol (MCP) server for integrating with iCloud Mail using App Password authentication. This server provides tools to read, send, and manage emails through iCloud's IMAP and SMTP services.

> Development logs for this project are being shared on [Hack Club's Summer of Making](https://summer.hackclub.com/projects/7559). Check it out to follow the development journey!

## Features

- **Secure Authentication**: Uses App-specific passwords for secure iCloud Mail access
- **Email Management**: Read, send, and organize emails
- **Mailbox Operations**: List mailboxes, mark messages as read
- **Attachment Support**: Handle email attachments
- **MCP Integration**: Seamless integration with MCP-compatible clients

## Prerequisites

1. **iCloud Account**: You need an active iCloud account with Mail enabled
2. **App Password**: Generate an app-specific password for Mail access:
   - Sign in to [appleid.apple.com](https://appleid.apple.com)
   - Go to "Sign-In and Security" > "App-Specific Passwords"
   - Generate a new password for "Mail"
   - Save this password securely

## Installation

```bash
# Clone the repository
git clone https://github.com/minagishl/icloud-mail-mcp.git
cd icloud-mail-mcp

# Install dependencies using pnpm
pnpm install

# Build the project
pnpm run build
```

## Configuration

The server requires environment variables to be set for authentication. Configuration is done through your MCP client settings:

### Environment Variables (Required)

Add to your MCP server configuration:

```json
{
  "icloud-mail-mcp": {
    "command": "node",
    "args": ["/path/to/icloud-mail-mcp/dist/index.js"],
    "env": {
      "ICLOUD_EMAIL": "your-email@icloud.com",
      "ICLOUD_APP_PASSWORD": "your-app-specific-password"
    }
  }
}
```

## Available Tools

<details>
<summary><strong>Click to view all available tools</strong></summary>

### Email Operations

#### `get_messages`

Retrieve email messages from a specified mailbox.

**Parameters:**

- `mailbox` (string, optional): Mailbox name (default: "INBOX")
- `limit` (number, optional): Maximum number of messages to retrieve (default: 10)
- `unreadOnly` (boolean, optional): Retrieve only unread messages (default: false)

#### `send_email`

Send an email through iCloud Mail.

**Parameters:**

- `to` (string or array, required): Recipient email address(es)
- `subject` (string, required): Email subject
- `text` (string, optional): Plain text email body
- `html` (string, optional): HTML email body

#### `mark_as_read`

Mark email messages as read.

**Parameters:**

- `messageIds` (array, required): Array of message IDs to mark as read
- `mailbox` (string, optional): Mailbox name (default: "INBOX")

#### `move_messages`

Move messages between mailboxes.

**Parameters:**

- `messageIds` (array, required): Array of message IDs to move
- `sourceMailbox` (string, required): Source mailbox name
- `destinationMailbox` (string, required): Destination mailbox name

#### `search_messages`

Search for messages using various criteria.

**Parameters:**

- `query` (string, optional): Search query text (searches in subject, from, body)
- `mailbox` (string, optional): Mailbox name (default: "INBOX")
- `limit` (number, optional): Maximum number of messages to retrieve (default: 10)
- `dateFrom` (string, optional): Start date for search (YYYY-MM-DD format)
- `dateTo` (string, optional): End date for search (YYYY-MM-DD format)
- `fromEmail` (string, optional): Filter by sender email address
- `unreadOnly` (boolean, optional): Search only unread messages (default: false)

#### `delete_messages`

Delete messages from a mailbox.

**Parameters:**

- `messageIds` (array, required): Array of message IDs to delete
- `mailbox` (string, optional): Mailbox name (default: "INBOX")

#### `set_flags`

Set flags on messages (read, unread, flagged, etc.).

**Parameters:**

- `messageIds` (array, required): Array of message IDs to set flags on
- `flags` (array, required): Array of flags to set (e.g., ["\\Seen", "\\Flagged"])
- `mailbox` (string, optional): Mailbox name (default: "INBOX")
- `action` (string, optional): Whether to "add" or "remove" the flags (default: "add")

#### `download_attachment`

Download an attachment from a specific message.

**Parameters:**

- `messageId` (string, required): Message ID containing the attachment
- `attachmentIndex` (number, optional): Index of the attachment to download (0-based, default: 0)
- `mailbox` (string, optional): Mailbox name (default: "INBOX")

#### `auto_organize`

Automatically organize emails based on rules (sender, subject keywords, etc.).

**Parameters:**

- `rules` (array, required): Array of organization rules with conditions and actions
- `sourceMailbox` (string, optional): Source mailbox to organize (default: "INBOX")
- `dryRun` (boolean, optional): If true, only shows what would be organized without moving emails (default: false)

**Rule Structure:**

```json
{
  "name": "Rule name",
  "condition": {
    "fromContains": "sender keyword",
    "subjectContains": "subject keyword"
  },
  "action": {
    "moveToMailbox": "destination folder"
  }
}
```

### Mailbox Management

#### `get_mailboxes`

List all available mailboxes in your iCloud Mail account.

**Parameters:** None

#### `create_mailbox`

Create a new mailbox (folder) in your iCloud Mail account.

**Parameters:**

- `name` (string, required): Name of the mailbox to create

#### `delete_mailbox`

Delete an existing mailbox (folder) from your iCloud Mail account.

**Parameters:**

- `name` (string, required): Name of the mailbox to delete

**Safety Features:**

- Prevents deletion of system mailboxes (INBOX, Sent, Trash, Drafts, Junk)
- Validates mailbox name input
- Provides detailed error messages for common issues

### System Tools

#### `test_connection`

Test the email server connection to verify IMAP and SMTP connectivity.

**Parameters:** None

#### `check_config`

Check if environment variables are properly configured and show connection status.

**Parameters:** None

</details>

## Usage Example

<details>
<summary><strong>Click to view usage examples</strong></summary>

### Getting Started

**Start the MCP server:**

```bash
# With environment variables (recommended)
ICLOUD_EMAIL="your-email@icloud.com" ICLOUD_APP_PASSWORD="your-app-password" pnpm run start

# Or start normally and configure manually
pnpm run start
```

### Email Operations

**Get recent messages:**

```json
{
  "tool": "get_messages",
  "arguments": {
    "limit": 5,
    "unreadOnly": true
  }
}
```

**Send an email:**

```json
{
  "tool": "send_email",
  "arguments": {
    "to": "recipient@example.com",
    "subject": "Hello from MCP",
    "text": "This email was sent using the iCloud Mail MCP server!"
  }
}
```

**Move messages between mailboxes:**

```json
{
  "tool": "move_messages",
  "arguments": {
    "messageIds": ["message-id-1", "message-id-2"],
    "sourceMailbox": "INBOX",
    "destinationMailbox": "My Custom Folder"
  }
}
```

### Mailbox Management

**Create a new mailbox:**

```json
{
  "tool": "create_mailbox",
  "arguments": {
    "name": "My Custom Folder"
  }
}
```

**Delete a mailbox:**

```json
{
  "tool": "delete_mailbox",
  "arguments": {
    "name": "My Custom Folder"
  }
}
```

### System Tools

**Test connection:**

```json
{
  "tool": "test_connection",
  "arguments": {}
}
```

**Check configuration:**

```json
{
  "tool": "check_config",
  "arguments": {}
}
```

</details>

## Security Notes

- **App Passwords**: Always use app-specific passwords, never your main iCloud password
- **Secure Storage**: Store your app password securely and never commit it to version control
- **Connection Security**: All connections use TLS/SSL encryption
- **Minimal Permissions**: The server only accesses Mail functionality

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build the project
pnpm run build

# Type checking
pnpm run typecheck

# Run tests
pnpm run test

# Run linting
pnpm run lint
```

## Testing

This project includes comprehensive test coverage using Vitest. The test suite covers:

### Test Structure

- **Total Tests**: 29 tests across 3 test files
- **Framework**: Vitest with TypeScript support
- **Coverage**: Core functionality, type definitions, and configuration

### Test Categories

#### 1. Core Client Tests (`src/lib/icloud-mail-client.test.ts`)

- **Constructor validation**: Tests client creation with various configurations
- **Email name extraction**: Tests handling of different email formats
- **Basic functionality**: Tests core client behavior and configuration validation

#### 2. Type Definition Tests (`src/types/config.test.ts`)

- **iCloudConfig**: Tests configuration object structure
- **EmailMessage**: Tests email message data types
- **SendEmailOptions**: Tests email sending parameter validation
- **SearchOptions**: Tests search parameter structures
- **OrganizationRule**: Tests email organization rule definitions
- **Attachment**: Tests attachment data structures

#### 3. Server Configuration Tests (`src/index.test.ts`)

- **Environment variables**: Tests handling of configuration environment variables
- **Credential masking**: Tests security functions for hiding sensitive data
- **Config validation**: Tests basic configuration validation logic

### Running Tests

```bash
# Run all tests once
pnpm run test:run

# Run tests in watch mode (interactive)
pnpm run test

# Run tests with UI interface
pnpm run test:ui
```

### Test Features

- **Type Safety**: All tests are written in TypeScript without using `any`
- **Mocking**: External dependencies (IMAP, SMTP) are properly mocked
- **Coverage**: Tests cover both happy path and edge cases
- **Isolation**: Each test is independent and properly cleaned up
- **Real-world scenarios**: Tests reflect actual usage patterns

## Troubleshooting

### Authentication Issues

- Verify your app password is correct and hasn't expired
- Ensure two-factor authentication is enabled on your iCloud account
- Check that Mail is enabled in your iCloud settings

### Connection Problems

- Verify internet connectivity
- Check if iCloud Mail servers are accessible
- Ensure firewall settings allow connections to imap.mail.me.com and smtp.mail.me.com

### Email Not Sending

- Verify SMTP settings and authentication
- Check recipient email addresses are valid
- Ensure you're not hitting rate limits

## iCloud Mail Server Settings

The server uses the following default settings for iCloud Mail:

- **IMAP Server**: imap.mail.me.com (Port: 993, SSL: Yes)
- **SMTP Server**: smtp.mail.me.com (Port: 587, TLS: Yes)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
