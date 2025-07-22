import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import nodemailer from "nodemailer";
import {
  iCloudConfig,
  EmailMessage,
  SendEmailOptions,
  Attachment,
} from "../types/config.js";

export class iCloudMailClient {
  private imap: Imap;
  private transporter: nodemailer.Transporter;
  private config: iCloudConfig;

  constructor(config: iCloudConfig) {
    this.config = config;

    this.imap = new Imap({
      user: config.email,
      password: config.appPassword,
      host: config.imapHost || "imap.mail.me.com",
      port: config.imapPort || 993,
      tls: true,
      tlsOptions: { servername: config.imapHost || "imap.mail.me.com" },
    });

    this.transporter = nodemailer.createTransport({
      host: config.smtpHost || "smtp.mail.me.com",
      port: config.smtpPort || 587,
      secure: false,
      auth: {
        user: config.email,
        pass: config.appPassword,
      },
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        console.error("IMAP connection ready");
        resolve();
      });

      this.imap.once("error", (err: Error) => {
        console.error("IMAP connection error:", err);
        reject(err);
      });

      this.imap.connect();
    });
  }

  async testConnection(): Promise<{ status: string; message: string }> {
    try {
      await this.connect();
      await this.disconnect();

      // Test SMTP connection
      await this.transporter.verify();

      return {
        status: "success",
        message:
          "Email connection test successful - both IMAP and SMTP are working",
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.imap.once("end", () => {
        resolve();
      });
      this.imap.end();
    });
  }

  async getMailboxes(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.imap.getBoxes((err: Error, boxes: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(boxes);
      });
    });
  }

  async getMessages(
    mailbox: string = "INBOX",
    limit: number = 10,
    unreadOnly: boolean = false
  ): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(mailbox, true, (err: Error) => {
        if (err) {
          reject(err);
          return;
        }

        const searchCriteria = unreadOnly ? ["UNSEEN"] : ["ALL"];

        this.imap.search(searchCriteria, (err: Error, results: number[]) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            resolve([]);
            return;
          }

          const messageIds = results.slice(-limit);
          const fetch = this.imap.fetch(messageIds, {
            bodies: "",
            struct: true,
          });

          const messages: EmailMessage[] = [];

          fetch.on("message", (msg: any, seqno: number) => {
            let emailData = "";

            msg.on("body", (stream: NodeJS.ReadableStream) => {
              stream.on("data", (chunk: Buffer) => {
                emailData += chunk.toString("utf8");
              });

              stream.once("end", async () => {
                try {
                  const parsed: ParsedMail = await simpleParser(emailData);

                  const attachments: Attachment[] = [];
                  if (parsed.attachments) {
                    parsed.attachments.forEach((att: any) => {
                      attachments.push({
                        filename: att.filename || "unknown",
                        contentType:
                          att.contentType || "application/octet-stream",
                        size: att.size || 0,
                        data: att.content,
                      });
                    });
                  }

                  const getEmailText = (addr: any) => {
                    if (!addr) return "";
                    if (Array.isArray(addr))
                      return addr.map((a) => a.text || a.address).join(", ");
                    return addr.text || addr.address || "";
                  };

                  const emailMessage: EmailMessage = {
                    id: parsed.messageId || `${seqno}`,
                    from: getEmailText(parsed.from),
                    to: parsed.to
                      ? Array.isArray(parsed.to)
                        ? parsed.to.map((t) => getEmailText(t))
                        : [getEmailText(parsed.to)]
                      : [],
                    subject: parsed.subject || "",
                    body: parsed.text || parsed.html || "",
                    date: parsed.date || new Date(),
                    flags: [],
                    attachments:
                      attachments.length > 0 ? attachments : undefined,
                  };

                  messages.push(emailMessage);
                } catch (parseError) {
                  console.error("Error parsing email:", parseError);
                }
              });
            });

            msg.once("attributes", (attrs: any) => {
              if (attrs.flags) {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage) {
                  lastMessage.flags = attrs.flags;
                }
              }
            });
          });

          fetch.once("error", (fetchErr: Error) => {
            reject(fetchErr);
          });

          fetch.once("end", () => {
            resolve(messages);
          });
        });
      });
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.config.email,
      to: options.to,
      subject: options.subject,
    };

    if (options.text) {
      mailOptions.text = options.text;
    }

    if (options.html) {
      mailOptions.html = options.html;
    }

    if (options.attachments) {
      mailOptions.attachments = options.attachments.map((att) => ({
        filename: att.filename,
        path: att.path,
        content: att.content,
        contentType: att.contentType,
      }));
    }

    const info = await this.transporter.sendMail(mailOptions);
    return { messageId: info.messageId };
  }

  async markAsRead(
    messageIds: string[],
    mailbox: string = "INBOX"
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(mailbox, false, (err: Error) => {
        if (err) {
          reject(err);
          return;
        }

        this.imap.search(["ALL"], (err: Error, results: number[]) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            resolve();
            return;
          }

          this.imap.addFlags(results, ["\\Seen"], (err: Error) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
      });
    });
  }

  async createMailbox(
    name: string
  ): Promise<{ status: string; message: string }> {
    return new Promise((resolve) => {
      this.imap.addBox(name, (err: Error) => {
        if (err) {
          resolve({
            status: "error",
            message: err.message,
          });
          return;
        }

        resolve({
          status: "success",
          message: `Mailbox '${name}' created successfully`,
        });
      });
    });
  }
}
