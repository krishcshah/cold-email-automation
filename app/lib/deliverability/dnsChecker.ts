import dns from "dns/promises";

export interface DnsCheckResult {
  domain: string;
  spfValid: boolean;
  spfRecord?: string;
  dmarcValid: boolean;
  dmarcRecord?: string;
  mxValid: boolean;
  mxRecords?: string[];
  issues: string[];
}

export async function checkDomainDns(domain: string): Promise<DnsCheckResult> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim().toLowerCase();
  const issues: string[] = [];

  let spfValid = false;
  let spfRecord: string | undefined;
  let dmarcValid = false;
  let dmarcRecord: string | undefined;
  let mxValid = false;
  let mxRecords: string[] = [];

  // 1. Check MX Records
  try {
    const mx = await dns.resolveMx(cleanDomain);
    if (mx && mx.length > 0) {
      mxValid = true;
      mxRecords = mx.map((m) => m.exchange);
    } else {
      issues.push("No MX records found. Domain cannot receive emails.");
    }
  } catch {
    issues.push("Failed to resolve MX records.");
  }

  // 2. Check SPF Record (TXT record on root domain)
  try {
    const txtRecords = await dns.resolveTxt(cleanDomain);
    const flatTxt = txtRecords.map((r) => r.join(""));
    const spf = flatTxt.find((r) => r.startsWith("v=spf1"));

    if (spf) {
      spfValid = true;
      spfRecord = spf;
    } else {
      issues.push("Missing SPF record (v=spf1). Emails may fail authentication.");
    }
  } catch {
    issues.push("Missing or unresolvable SPF TXT record.");
  }

  // 3. Check DMARC Record (TXT record on _dmarc.domain)
  try {
    const dmarcTxt = await dns.resolveTxt(`_dmarc.${cleanDomain}`);
    const flatDmarc = dmarcTxt.map((r) => r.join(""));
    const dmarc = flatDmarc.find((r) => r.startsWith("v=DMARC1"));

    if (dmarc) {
      dmarcValid = true;
      dmarcRecord = dmarc;
    } else {
      issues.push("Missing DMARC record (_dmarc.domain). Recommending setting up p=none or p=quarantine.");
    }
  } catch {
    issues.push("Missing DMARC record.");
  }

  return {
    domain: cleanDomain,
    spfValid,
    spfRecord,
    dmarcValid,
    dmarcRecord,
    mxValid,
    mxRecords,
    issues,
  };
}
