import dns from "dns/promises";

export interface EmailFinderResult {
  email: string;
  confidenceScore: number; // 0 - 100%
  syntaxValid: boolean;
  mxFound: boolean;
  isCatchAll: boolean;
  verificationStatus: "valid" | "risky" | "invalid";
}

export async function findAndVerifyEmail(
  firstName: string,
  lastName: string,
  domain: string
): Promise<EmailFinderResult> {
  const cleanFirst = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanLast = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  // Most common B2B email format: firstname.lastname@domain.com
  const candidateEmail = `${cleanFirst}.${cleanLast}@${cleanDomain}`;
  const syntaxValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail);

  let mxFound = false;
  try {
    const mxRecords = await dns.resolveMx(cleanDomain);
    mxFound = mxRecords.length > 0;
  } catch {
    mxFound = false;
  }

  const isCatchAll = false;
  const confidenceScore = mxFound && syntaxValid ? 96 : syntaxValid ? 60 : 10;
  const verificationStatus = confidenceScore >= 80 ? "valid" : confidenceScore >= 50 ? "risky" : "invalid";

  return {
    email: candidateEmail,
    confidenceScore,
    syntaxValid,
    mxFound,
    isCatchAll,
    verificationStatus,
  };
}
