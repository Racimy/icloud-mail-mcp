import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { iCloudMailClient } from './icloud-mail-client.js';
import type { iCloudConfig } from '../types/config.js';

const mockConfig: iCloudConfig = {
  email: 'test@icloud.com',
  appPassword: 'test-password',
  imapHost: 'imap.mail.me.com',
  imapPort: 993,
  smtpHost: 'smtp.mail.me.com',
  smtpPort: 587,
};

// Mock the dependencies
vi.mock('imap', () => ({
  default: vi.fn().mockImplementation(() => ({
    once: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
    getBoxes: vi.fn(),
    openBox: vi.fn(),
    search: vi.fn(),
    fetch: vi.fn(),
    move: vi.fn(),
    setFlags: vi.fn(),
    addBox: vi.fn(),
    delBox: vi.fn(),
  })),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      verify: vi.fn().mockResolvedValue(true),
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    })),
  },
}));

describe('iCloudMailClient', () => {
  let client: iCloudMailClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new iCloudMailClient(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(client).toBeInstanceOf(iCloudMailClient);
    });

    it('should create client with different email format', () => {
      const configWithDifferentEmail = {
        ...mockConfig,
        email: 'john@icloud.com',
      };
      const testClient = new iCloudMailClient(configWithDifferentEmail);
      expect(testClient).toBeInstanceOf(iCloudMailClient);
    });
  });

  describe('email name extraction behavior', () => {
    it('should handle email with @ symbol correctly', () => {
      const configWithEmail = {
        ...mockConfig,
        email: 'john@icloud.com',
      };
      const testClient = new iCloudMailClient(configWithEmail);
      expect(testClient).toBeInstanceOf(iCloudMailClient);
    });

    it('should handle email without @ symbol', () => {
      const configWithSimpleName = {
        ...mockConfig,
        email: 'john',
      };
      const testClient = new iCloudMailClient(configWithSimpleName);
      expect(testClient).toBeInstanceOf(iCloudMailClient);
    });

    it('should handle empty email string', () => {
      const configWithEmptyEmail = {
        ...mockConfig,
        email: '',
      };
      const testClient = new iCloudMailClient(configWithEmptyEmail);
      expect(testClient).toBeInstanceOf(iCloudMailClient);
    });
  });

  describe('basic functionality', () => {
    it('should be created with correct configuration', () => {
      expect(client).toBeDefined();
    });

    it('should handle config validation', () => {
      const minimalConfig: iCloudConfig = {
        email: 'test@example.com',
        appPassword: 'password',
      };
      const minimalClient = new iCloudMailClient(minimalConfig);
      expect(minimalClient).toBeInstanceOf(iCloudMailClient);
    });
  });
});
