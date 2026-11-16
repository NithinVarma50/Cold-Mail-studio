export const EMAIL_RFC5322_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_RFC5322_REGEX.test(email.trim());
}

export interface RecipientData {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  custom_data?: Record<string, string> | string | null;
  [key: string]: any;
}

function buildLookupMap(recipient: RecipientData): Map<string, string> {
  const map = new Map<string, string>();

  const add = (k: string, v: any) => {
    if (v !== undefined && v !== null) {
      const valStr = String(v).trim();
      map.set(k.toLowerCase().replace(/[^a-z0-9]/g, ''), valStr);
      map.set(k.toLowerCase(), valStr);
      map.set(k, valStr);
    }
  };

  if (recipient.email) add('email', recipient.email);
  if (recipient.first_name) {
    add('first_name', recipient.first_name);
    add('firstname', recipient.first_name);
    add('first', recipient.first_name);
  }
  if (recipient.last_name) {
    add('last_name', recipient.last_name);
    add('lastname', recipient.last_name);
    add('last', recipient.last_name);
  }
  if (recipient.company) {
    add('company', recipient.company);
    add('company_name', recipient.company);
    add('companyname', recipient.company);
  }

  let custom: Record<string, any> = {};
  if (typeof recipient.custom_data === 'string') {
    try {
      custom = JSON.parse(recipient.custom_data);
    } catch {}
  } else if (typeof recipient.custom_data === 'object' && recipient.custom_data !== null) {
    custom = recipient.custom_data;
  }

  for (const [k, v] of Object.entries(custom)) {
    add(k, v);
  }

  for (const [k, v] of Object.entries(recipient)) {
    if (!['custom_data'].includes(k)) {
      add(k, v);
    }
  }

  return map;
}

export function interpolateTemplate(template: string, recipient: RecipientData): string {
  if (!template) return '';
  const lookup = buildLookupMap(recipient);

  const regex = /\{\{\s*([a-zA-Z0-9_\-\.]+)(?:\s*\|\s*([^}]+))?\s*\}\}/g;

  return template.replace(regex, (_match, varName: string, fallback?: string) => {
    const cleanKey = varName.trim();
    const cleanLower = cleanKey.toLowerCase();
    const cleanAlpha = cleanLower.replace(/[^a-z0-9]/g, '');

    let value: string | undefined = lookup.get(cleanKey);
    if (!value) value = lookup.get(cleanLower);
    if (!value) value = lookup.get(cleanAlpha);

    if (value && value.trim().length > 0) {
      return value.trim();
    }

    if (fallback !== undefined) {
      return fallback.trim();
    }

    return '';
  });
}
