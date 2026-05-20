export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const canonicalizeGmailLocalPart = (localPart: string): string => {
  const withoutPlusAlias = localPart.split("+")[0] ?? localPart;
  return withoutPlusAlias.replace(/\./g, "");
};

export const normalizeEmailForStorage = (email: string): string => {
  const normalized = normalizeEmail(email);
  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain) {
    return normalized;
  }

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return `${canonicalizeGmailLocalPart(localPart)}@gmail.com`;
  }

  return normalized;
};

export const getEmailLookupVariants = (email: string): string[] => {
  const normalized = normalizeEmail(email);
  const canonical = normalizeEmailForStorage(email);
  return [...new Set([normalized, canonical])];
};
