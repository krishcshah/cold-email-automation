import dns from "dns/promises";

export interface BlacklistCheckResult {
  domain: string;
  isBlacklisted: boolean;
  blacklistsChecked: number;
  listings: { name: string; host: string; listed: boolean; details?: string }[];
}

const DNSBL_SERVERS = [
  { name: "Spamhaus ZEN", host: "zen.spamhaus.org" },
  { name: "Spamcop", host: "bl.spamcop.net" },
  { name: "SORBS Aggregate", host: "dnsbl.sorbs.net" },
  { name: "Barracuda Central", host: "b.barracudacentral.org" },
  { name: "Truncate", host: "truncate.gbudb.net" },
];

export async function checkBlacklists(domain: string): Promise<BlacklistCheckResult> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim().toLowerCase();
  
  let targetIp = cleanDomain;
  try {
    const ips = await dns.resolve4(cleanDomain);
    if (ips && ips.length > 0) {
      targetIp = ips[0];
    }
  } catch {
    // If domain doesn't resolve to IPv4 directly, proceed with domain name
  }

  const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(targetIp);
  const reversedQuery = isIp
    ? targetIp.split(".").reverse().join(".")
    : cleanDomain;

  const listings: { name: string; host: string; listed: boolean; details?: string }[] = [];

  for (const dnsbl of DNSBL_SERVERS) {
    try {
      const lookupHost = `${reversedQuery}.${dnsbl.host}`;
      const res = await dns.resolve4(lookupHost);
      const isListed = res && res.length > 0;
      listings.push({
        name: dnsbl.name,
        host: dnsbl.host,
        listed: isListed,
        details: isListed ? `Listed (${res.join(", ")})` : undefined,
      });
    } catch {
      // NXDOMAIN = Not listed (clean)
      listings.push({
        name: dnsbl.name,
        host: dnsbl.host,
        listed: false,
      });
    }
  }

  const isBlacklisted = listings.some((l) => l.listed);

  return {
    domain: cleanDomain,
    isBlacklisted,
    blacklistsChecked: DNSBL_SERVERS.length,
    listings,
  };
}
