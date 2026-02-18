const SHARE_BASE: Record<string, (u: string, t: string) => string> = {
  twitter: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
};

export function openShare(platform: keyof typeof SHARE_BASE, url: string, title: string): void {
  const build = SHARE_BASE[platform];
  if (build) window.open(build(url, title), '_blank', 'noopener,noreferrer');
}
