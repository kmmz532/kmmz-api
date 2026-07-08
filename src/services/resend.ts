// Resend REST API 経由でメール送信(SDK 不要・Workers 向け)
export async function sendViaResend(
  apiKey: string,
  message: { from: string; to: string; subject: string; text?: string; html?: string }
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
}
