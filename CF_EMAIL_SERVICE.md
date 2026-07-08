# Cloudflare Email Service まとめ

最終更新: 2026-07-08

## 概要

Cloudflare Email Service は、Workers からネイティブにメールを**送受信**できるインフラ。

- **受信**: Email Routing(以前から無料で提供)
- **送信**: Email Sending(**2026-04-16 にパブリックベータ**入り)

これにより Resend / SendGrid / SMTP を経由せず、Cloudflare だけで独自ドメインのメール送受信が完結する。

```
受信:  相手のメールサーバー → Email Routing → Worker (email ハンドラ / Agents SDK の onEmail)
送信:  Worker → Email Service (send_email バインディング) → 相手のメールサーバー
```

## 送信 API(send_email バインディング)

### wrangler.jsonc

```jsonc
{
  "send_email": [{ "name": "EMAIL" }]
}
```

### Worker コード

```ts
const result = await env.EMAIL.send({
  from: "noreply@kmmz.jp",   // Email Service で検証済みドメインのアドレス
  to: "user@example.com",    // 任意の外部アドレスに送信可能
  subject: "件名",
  text: "本文",
  html: "<p>本文</p>",       // 任意
});
// 成功時: { messageId } を返す
// 失敗時: .code / .message を持つエラーを throw
```

Workers バインディングのほか、REST API と SDK(TypeScript / Python / Go)もある。

### 型定義の注意

`@cloudflare/workers-types` は旧 API(`EmailMessage` + `cloudflare:email`)のみで、
新しい `send()` ビルダー API には未対応(2026-07 時点)。このリポジトリでは
[src/services/email.ts](src/services/email.ts) の `EmailSender` インターフェースを自前定義している。

## セットアップ手順

1. Cloudflare ダッシュボードで対象ゾーン(kmmz.jp)の **Email Service** を有効化
2. 送信ドメインを追加 — SPF / DKIM / DMARC レコードは**自動設定**される
3. `wrangler.jsonc` に `send_email` バインディングを追加してデプロイ

## 制限・注意点

- **差出人(from)はドメイン検証が必須**。宛先(to)は任意の外部アドレスでOK
- バインディング設定で送信者・宛先を制限することも可能
- レート制限・日次送信クォータあり(具体値はプランにより異なる。公式ドキュメント参照)
- パブリックベータのため API が変わる可能性あり
- 返信ルーティングには HMAC-SHA256 署名によるヘッダ偽造対策がある
- `wrangler dev`(ローカル)では実送信されず、コンソールにログ出力される

## 旧 API との違い

| | 旧: Email Workers | 新: Email Service |
|---|---|---|
| 送信方法 | `EmailMessage`(`cloudflare:email`)+ mimetext で MIME 手組み | `env.EMAIL.send({ from, to, subject, text })` |
| 宛先 | Email Routing の**検証済み宛先のみ** | **任意の外部アドレス** |
| 用途 | 自分への転送・通知 | トランザクションメール全般 |

## Resend との使い分け

**Cloudflare だけで十分**: 通知メール、問い合わせフォームの自動返信、パスワードリセット、小〜中規模のトランザクションメール、AIエージェントの返信。

**Resend が向く**: React Email 連携、テンプレート管理、配信分析ダッシュボード、Webhook による配信状況の可視化など、SaaS 的な運用機能が必要な場合。Email Service はあくまで「送信基盤」。

## 参考リンク

- 発表ブログ: https://blog.cloudflare.com/email-for-agents/
- 送信ドキュメント: https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/
- 実装例(送受信+DO+R2+Workers AI): https://github.com/cloudflare/agentic-inbox

## このリポジトリでの利用箇所

- [src/services/email.ts](src/services/email.ts) — `EmailSender` 型定義と自動返信の実装
- [src/routes/contact.ts](src/routes/contact.ts) — `waitUntil` で best-effort 送信
- [wrangler.jsonc](wrangler.jsonc) — `send_email` バインディングと `CONTACT_FROM_ADDRESS`
