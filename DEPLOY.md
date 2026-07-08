# デプロイ (Cloudflare Workers Builds)

このリポジトリは **Workers Builds**(Cloudflare の GitHub 連携 CI/CD)でデプロイする。
`main` に push すると Cloudflare が自動でビルド・デプロイする。

## 初回セットアップ(ダッシュボードで一度だけ)

1. Cloudflare Dashboard → **Workers & Pages** → 対象の `kmmz-api` Worker を開く
   - 初回は先に一度ローカルから `npm run deploy` で Worker を作成しておくと連携がスムーズ
2. **Settings → Build** → **Connect** で GitHub リポジトリ `kmmz532/kmmz-api` を連携
3. ビルド設定:
   - **Build command**: (空でよい / 依存インストールは自動)
   - **Deploy command**: `npx wrangler deploy`
   - **Branch**: `main`
   - **Root directory**: `/`
4. 保存すると、以降 `main` への push ごとに自動デプロイされる

## シークレット / 環境変数

Workers Builds はコードをデプロイするだけ。**シークレットはリポジトリに入れず**、
Cloudflare 側に登録する(一度だけ)。

### DISCORD_WEBHOOK_URL(シークレット)

ダッシュボード: 対象 Worker → **Settings → Variables and Secrets** → **Add** →
Type を **Secret** にして `DISCORD_WEBHOOK_URL` を登録。

または CLI:

```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
```

### CONTACT_FROM_ADDRESS(通常の変数)

`wrangler.jsonc` の `vars` に定義済み(`noreply@kmmz.jp`)なので、
コードと一緒にデプロイされる。変更はファイルを編集して push すればよい。

## Email Service の有効化(送信の前提)

自動返信メールを送るには、対象ゾーンで Cloudflare Email Service を有効化し、
`noreply@kmmz.jp` の送信ドメインを検証しておく必要がある。詳細は
[CF_EMAIL_SERVICE.md](CF_EMAIL_SERVICE.md) を参照。

## 手動デプロイ(緊急時 / ローカルから)

```bash
npm run deploy   # wrangler deploy --minify
```

## デプロイ前チェック

```bash
npx tsc --noEmit            # 型チェック
npx wrangler deploy --dry-run   # ビルド検証(実デプロイなし)
```
