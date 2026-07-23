import nodemailer from "nodemailer";

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs for testing
    },
  });
}

export async function testSmtpConnection(config: SmtpConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface SendEmailOptions {
  smtpConfig: SmtpConfig;
  to: string;
  subject: string;
  html: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ messageId: string }> {
  const transporter = createTransporter(options.smtpConfig);
  const info = await transporter.sendMail({
    from: `"${options.smtpConfig.fromName}" <${options.smtpConfig.fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    messageId: options.messageId,
    inReplyTo: options.inReplyTo,
    references: options.references,
    headers: options.headers,
  });
  return { messageId: info.messageId };
}
