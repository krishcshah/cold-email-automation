import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSmsViaTwilio(
  userId: string,
  toPhone: string,
  bodyText: string
): Promise<SendSmsResult> {
  const account = await prisma.twilioAccount.findUnique({
    where: { userId },
  });

  if (!account || !account.accountSid || !account.authToken) {
    return { success: false, error: "Twilio credentials not configured for this user" };
  }

  const authToken = decrypt(account.authToken);

  try {
    // Twilio REST API invocation
    const authHeader = "Basic " + Buffer.from(`${account.accountSid}:${authToken}`).toString("base64");
    const formData = new URLSearchParams();
    formData.append("From", account.phoneNumber);
    formData.append("To", toPhone);
    formData.append("Body", bodyText);

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${account.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to send Twilio SMS" };
    }

    return { success: true, messageId: data.sid };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
