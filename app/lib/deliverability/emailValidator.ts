import dns from "dns/promises";

export interface EmailValidationResult {
  email: string;
  isValid: boolean;
  reason?: string;
  checks: {
    syntax: boolean;
    disposable: boolean;
    mx: boolean;
  };
}

const KNOWN_DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com",
  "trashmail.com", "yopmail.com", "sharklasers.com", "getairmail.com",
  "dispostable.com", "temp-mail.org", "throwawaymail.com", "maildrop.cc",
]);

export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Syntax Regex Check
  const syntaxRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const syntaxValid = syntaxRegex.test(cleanEmail);

  if (!syntaxValid) {
    return {
      email: cleanEmail,
      isValid: false,
      reason: "Invalid email syntax format",
      checks: { syntax: false, disposable: false, mx: false },
    };
  }

  const [, domain] = cleanEmail.split("@");

  // 2. Disposable domain check
  const isDisposable = KNOWN_DISPOSABLE_DOMAINS.has(domain);
  if (isDisposable) {
    return {
      email: cleanEmail,
      isValid: false,
      reason: "Disposable or temporary email provider",
      checks: { syntax: true, disposable: true, mx: false },
    };
  }

  // 3. MX record lookup
  let mxValid = false;
  try {
    const mx = await dns.resolveMx(domain);
    mxValid = mx && mx.length > 0;
  } catch {
    mxValid = false;
  }

  if (!mxValid) {
    return {
      email: cleanEmail,
      isValid: false,
      reason: "Domain has no valid MX mail servers",
      checks: { syntax: true, disposable: false, mx: false },
    };
  }

  return {
    email: cleanEmail,
    isValid: true,
    checks: { syntax: true, disposable: false, mx: true },
  };
}
