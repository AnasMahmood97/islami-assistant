const EMOJI_FALLBACK = "🙂";

export function isEmojiAvatar(value?: string | null) {
  if (!value) return false;
  return !value.includes("/") && !value.startsWith("http://") && !value.startsWith("https://");
}

export function getAvatarEmoji(value?: string | null) {
  if (!isEmojiAvatar(value)) return null;
  return value || EMOJI_FALLBACK;
}

export function getAvatarImageUrl(value?: string | null) {
  if (!value || isEmojiAvatar(value)) return null;
  return value;
}
