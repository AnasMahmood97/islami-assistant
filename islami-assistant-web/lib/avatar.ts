import { getPublicUrl } from "@/lib/public-url";

const EMOJI_FALLBACK = "🙂";

export function isEmojiAvatar(value?: string | null) {
  if (!value) return false;
  return !getPublicUrl(value);
}

export function getAvatarEmoji(value?: string | null) {
  if (!isEmojiAvatar(value)) return null;
  return value || EMOJI_FALLBACK;
}

export function getAvatarImageUrl(value?: string | null) {
  if (!value || isEmojiAvatar(value)) return null;
  return getPublicUrl(value);
}
