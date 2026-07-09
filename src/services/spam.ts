import type { ContactInput } from "../validators/contact";

// me@kmmz.jp(メインメール)を守るための簡易スパム判定。
// contact@kmmz.jp には判定に関わらず届く(件名にフラグを付けるだけ)。
const SPAM_KEYWORDS = [
  "viagra",
  "cialis",
  "casino",
  "porn",
  "loan",
  "bitcoin",
  "crypto",
  "forex",
  "backlink",
  "seo service",
  "投資",
  "副業",
  "儲か",
  "出会い",
  "アダルト",
  "融資",
  "稼げ",
  "稼ぐ",
  "副収入",
  "副業",
  "FX",
  "仮想通貨",
  "ビットコイン",
  "ちんこ",
  "ちんぽ",
  "まんこ",
  "セックス",
  "エロ",
  "援助交際",
  "援交",
];

export function checkSpam(data: ContactInput): {
  spam: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const haystack = `${data.name}\n${data.message}`.toLowerCase();

  // URL が多すぎる
  const urls = data.message.match(/https?:\/\//gi) ?? [];
  if (urls.length >= 3) {
    reasons.push(`too_many_urls:${urls.length}`);
  }

  // スパムキーワード
  const hits = SPAM_KEYWORDS.filter((k) => haystack.includes(k.toLowerCase()));
  if (hits.length > 0) {
    reasons.push(`keyword:${hits.join(",")}`);
  }

  // 本文が極端に短くリンクだけ
  if (data.message.trim().length < 15 && urls.length > 0) {
    reasons.push("short_with_url");
  }

  return { spam: reasons.length > 0, reasons };
}
