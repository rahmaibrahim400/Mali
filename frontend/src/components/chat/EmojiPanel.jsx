import EmojiPicker, { Categories, EmojiStyle } from "emoji-picker-react";
import { useTranslation } from "react-i18next";

const CATEGORY_KEYS = [
  [Categories.SUGGESTED, "suggested"],
  [Categories.SMILEYS_PEOPLE, "smileys"],
  [Categories.ANIMALS_NATURE, "animals"],
  [Categories.FOOD_DRINK, "food"],
  [Categories.TRAVEL_PLACES, "travel"],
  [Categories.ACTIVITIES, "activities"],
  [Categories.OBJECTS, "objects"],
  [Categories.SYMBOLS, "symbols"],
  [Categories.FLAGS, "flags"],
];

// Full emoji picker (all categories + search + recently used), loaded only when first opened.
function EmojiPanel({ onPick }) {
  const { t } = useTranslation();

  return (
    <EmojiPicker
      onEmojiClick={(emoji) => onPick(emoji.emoji)}
      emojiStyle={EmojiStyle.NATIVE}
      lazyLoadEmojis
      autoFocusSearch={false}
      previewConfig={{ showPreview: false }}
      searchPlaceholder={t("chat.emojiSearch")}
      categories={CATEGORY_KEYS.map(([category, key]) => ({ category, name: t(`chat.emojiCategories.${key}`) }))}
      width="min(22rem, calc(100vw - 1.5rem))"
      height={380}
    />
  );
}

export default EmojiPanel;
