/**
 * Replaces {{variable}} tokens in a template string with values from a data object.
 * Supports fallback syntax: {{first_name | "there"}}
 */
export function substituteVariables(
  template: string,
  data: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, expr: string) => {
    const parts = expr.split("|").map((p) => p.trim());
    const key = parts[0];
    const fallback = parts[1]
      ? parts[1].replace(/^["']|["']$/g, "") // strip quotes
      : "";

    const value = data[key];
    return value != null && value !== "" ? value : fallback;
  });
}

/**
 * Builds a flat variable map from a Lead object + customFields.
 */
export function buildVariableMap(lead: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  title?: string | null;
  phone?: string | null;
  website?: string | null;
  customFields?: Record<string, string> | null;
}): Record<string, string> {
  return {
    email: lead.email,
    first_name: lead.firstName ?? "",
    last_name: lead.lastName ?? "",
    company: lead.company ?? "",
    title: lead.title ?? "",
    phone: lead.phone ?? "",
    website: lead.website ?? "",
    ...(lead.customFields ?? {}),
  };
}

/**
 * Injects open-tracking pixel and rewrites links for click tracking.
 */
export function injectTracking(
  html: string,
  options: {
    openToken?: string;
    appUrl: string;
    trackOpens: boolean;
    trackClicks: boolean;
    emailEventId?: string;
  }
): string {
  let result = html;

  // Rewrite <a href="..."> links for click tracking
  if (options.trackClicks && options.emailEventId) {
    result = result.replace(
      /href="(https?:\/\/[^"]+)"/gi,
      (_, url: string) => {
        if (url.includes(options.appUrl)) return `href="${url}"`;
        const clickToken = Buffer.from(
          JSON.stringify({ eventId: options.emailEventId, url })
        ).toString("base64url");
        return `href="${options.appUrl}/api/track/click/${clickToken}"`;
      }
    );
  }

  // Append 1x1 open pixel
  if (options.trackOpens && options.openToken) {
    result += `<img src="${options.appUrl}/api/track/open/${options.openToken}" width="1" height="1" style="display:none" alt="" />`;
  }

  return result;
}

/**
 * Checks if a reply body contains an unsubscribe intent.
 */
export function isUnsubscribeReply(bodyText: string): boolean {
  const lower = bodyText.toLowerCase();
  const keywords = [
    "unsubscribe",
    "remove me",
    "take me off",
    "stop emailing",
    "opt out",
    "opt-out",
    "please remove",
    "don't email",
    "do not email",
    "no more emails",
  ];
  return keywords.some((kw) => lower.includes(kw));
}
