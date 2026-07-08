import type { ContactInput } from "../validators/contact";

export async function notifyDiscord(
  webhookUrl: string,
  data: ContactInput
): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: data.name + " 様からのお問い合わせを受信しました",
          color: 0x5865f2,
          fields: [
            { name: "名前", value: data.name, inline: true },
            { name: "メール", value: data.email, inline: true },
            { name: "内容", value: data.message },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status}`);
  }
}
