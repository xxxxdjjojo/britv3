export const brandConfig = {
  displayName: "TrueDeed",
  shortName: "TrueDeed",
  lowercaseToken: "truedeed",
  canonicalDomain: "truedeed.co.uk",
  canonicalUrl: "https://truedeed.co.uk",
  supportEmail: "support@truedeed.co.uk",
  fromEmail: "hello@truedeed.co.uk",
  emails: {
    hello: "hello@truedeed.co.uk",
    support: "support@truedeed.co.uk",
    compliance: "compliance@truedeed.co.uk",
    privacy: "privacy@truedeed.co.uk",
    accessibility: "accessibility@truedeed.co.uk",
    complaints: "complaints@truedeed.co.uk",
  },
  social: {
    x: "https://twitter.com/truedeed",
    linkedIn: "https://linkedin.com/company/truedeed",
    instagram: "https://instagram.com/truedeed",
    facebook: "https://facebook.com/truedeed",
    twitterHandle: "@truedeed",
  },
  assets: {
    icon192: "/icons/icon-192.png",
    icon512: "/icons/icon-512.png",
    iconMaskable: "/icons/icon-maskable.png",
    logo: "/icons/icon-512.png",
    socialImage: "/opengraph-image",
  },
} as const;

export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? brandConfig.canonicalUrl;
}

function joinUrl(baseUrl: string, path = ""): string {
  if (!path) return baseUrl;
  if (/^https?:\/\//.test(path)) return path;

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export function brandUrl(path = ""): string {
  return joinUrl(brandConfig.canonicalUrl, path);
}

export function appUrl(path = ""): string {
  return joinUrl(appBaseUrl(), path);
}

export function emailFromHeader(): string {
  return `${brandConfig.displayName} <${brandConfig.fromEmail}>`;
}
