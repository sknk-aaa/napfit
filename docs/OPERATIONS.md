# OPERATIONS

運用の正（環境固定・ID類・ビルド/配信・課金）。変化が遅い情報のみ。手順の重複は書かず、汎用手順は外部レシピを参照する。

## 環境固定

| 項目 | 値 |
|---|---|
| プラットフォーム | iOS のみ（`supportsTablet: false`） |
| 最低OS | iOS 15.0 |
| フレームワーク | Expo SDK 54 + Expo Router |
| Bundle Identifier | `com.napfit.app` |
| Apple Team ID | `3H2LBDNPMU`（souma kaneko） |
| バージョン | 1.0.0（App Store リリース済み） |
| EAS Project ID | `2f131cee-0414-4621-9518-852bee1df650`（fastlane移行後は未使用） |

## ビルド / 配信

**EAS Build は廃止し、GitHub Actions + fastlane match 方式に移行済み（無料）。**

- 汎用手順の正: `~/.claude/docs/IOS_CICD_RECIPE.md`（他アプリ共通。落とし穴・Secrets作成手順はここ）
- リポは PUBLIC → GitHub Actions は無料・無制限
- ワークフロー: `.github/workflows/ios.yml`（ビルド→TestFlight）, `.github/workflows/ios-certs.yml`（証明書作成・初回1回）
- `ios/` `android/` はコミットしない。CIが毎回 `expo prebuild` で生成

### NapFit 固有の値

| 項目 | 値 |
|---|---|
| 証明書リポ | `https://github.com/sknk-aaa/certificates.git`（複数アプリで共有） |
| 必要 Secrets | `APPLE_TEAM_ID` / `MATCH_GIT_URL` / `MATCH_PASSWORD` / `MATCH_GIT_BASIC_AUTHORIZATION` / `APP_STORE_CONNECT_API_KEY_ID` / `APP_STORE_CONNECT_API_ISSUER_ID` / `APP_STORE_CONNECT_API_KEY` |

> `APPLE_TEAM_ID` は必ず `3H2LBDNPMU`（証明書/プロファイルの Development Team ID）と一致させる。不一致だと archive 時に「No profile for team matching」で失敗する。

### 配信フロー

1. Secrets 登録 → 「iOS Certificates」を1回実行（証明書リポに `com.napfit.app` の Profile を追加）
2. 「iOS TestFlight」を実行 → TestFlight に上がる（`distribute_external: false` = 内部テスター）
3. TestFlight 確認後、App Store Connect で本番提出

## 課金（RevenueCat）

| 項目 | 値 |
|---|---|
| 方式 | RevenueCat 経由のアプリ内課金 |
| 買い切り商品ID | `com.napfit.pro`（Non-Consumable, ¥480） |
| Entitlement ID | `pro` |
| iOS public SDK key | `src/pro/revenuecat.ts` にハードコード（クライアント公開前提のキー） |
| Pro状態の保持 | AsyncStorage（`pro:entitlement_active`）。24時間ごとに再検証 |

> 今後サブスクを追加する場合は、App Store Connect でサブスク商品を新規作成し、RevenueCat の Offering と `src/pro/{revenuecat,gate}.ts`・`app/pro-modal.tsx` を2択対応に改修する（HANDOFF 参照）。

## App Store メタデータ（日本）

| 項目 | 内容 |
|---|---|
| アプリ名 | NapFit - 仮眠タイマー＆記録 |
| サブタイトル | あなたに合う仮眠時間を見つける |
| キーワード | 仮眠,昼寝,パワーナップ,睡眠記録,アラーム,タイマー,疲労回復,睡眠管理,仕事効率化,休憩 |
| プライバシー | データ収集なし（端末内完結） |

## 公開ページ（GitHub Pages）

- `docs/privacy.html`（プライバシーポリシー）, `docs/terms.html`（利用規約）を GitHub Pages で配信
- Settings → Pages → Source: main / docs
