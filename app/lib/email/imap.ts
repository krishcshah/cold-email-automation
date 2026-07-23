import { ImapFlow } from "imapflow";

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export async function testImapConnection(config: ImapConfig): Promise<{ ok: boolean; error?: string }> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.port === 993,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface FetchedEmail {
  messageId: string;
  inReplyTo?: string;
  subject?: string;
  from?: string;
  bodyText?: string;
  bodyHtml?: string;
  date?: Date;
}

/**
 * Polls an IMAP inbox for unseen messages since a given date.
 */
export async function fetchUnseenEmails(
  config: ImapConfig,
  sinceDate: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)
): Promise<FetchedEmail[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.port === 993,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  const results: FetchedEmail[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Search for unseen messages since sinceDate
      const messages = client.fetch(
        { since: sinceDate, seen: false },
        { envelope: true, source: true, bodyStructure: true }
      );

      for await (const msg of messages) {
        const envelope = msg.envelope;
        const fetched: FetchedEmail = {
          messageId: envelope?.messageId ?? `${Date.now()}@unknown`,
          inReplyTo: envelope?.inReplyTo ?? undefined,
          subject: envelope?.subject ?? undefined,
          from: envelope?.from?.[0]?.address ?? undefined,
          date: envelope?.date ?? undefined,
        };

        // Parse body from source
        if (msg.source) {
          const raw = msg.source.toString();
          // Simple extraction: look for text between headers and body
          const parts = raw.split("\r\n\r\n");
          if (parts.length > 1) {
            fetched.bodyText = parts.slice(1).join("\r\n\r\n").trim();
          }
        }

        results.push(fetched);
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("IMAP fetch error:", err);
  }

  return results;
}
