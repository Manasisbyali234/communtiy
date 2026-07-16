import { Platform, Share } from 'react-native';

export async function shareUrl(message: string, url?: string): Promise<boolean> {
  if (Platform.OS !== 'web') {
    try {
      await Share.share({ message });
      return true;
    } catch {
      return false;
    }
  }

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');

  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'GowdaCommunity', text: message, url: shareUrl });
      return true;
    }
  } catch { /* dismissed */ }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    }
  } catch { /* unavailable on HTTP */ }

  // execCommand fallback — works on plain HTTP (local IP dev servers)
  try {
    const el = document.createElement('textarea');
    el.value = shareUrl;
    el.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
