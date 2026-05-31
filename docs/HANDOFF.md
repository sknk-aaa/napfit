# HANDOFF

現状・残タスク・既知の問題。仕様は [DESIGN.md](./DESIGN.md)、運用値は [OPERATIONS.md](./OPERATIONS.md) を参照（ここには重複させない）。

## 現在地

- **v1.0.0 を App Store にリリース済み**。現在 **v1.0.1** を TestFlight で検証中（次のストア更新に向けた作業フェーズ）
- ビルドは EAS → GitHub Actions + fastlane に移行**完了**（[OPERATIONS.md](./OPERATIONS.md)）
- UIの絵文字を Ionicons＋羊画像に置換**完了**

## ロードマップ（ユーザー決定の順序）

機能完成 → 課金拡張 → UI仕上げ → 英語対応 の順で進める。

### Phase 2-A: 機能を完成させ切る

| タスク | 現状 | やること | 主な対象 |
|---|---|---|---|
| BGM音源を増やす | `rain.mp3` 1種のみ。設定に選択UIあり | 厳選2〜3種を追加（音源選定が必要） | `src/audio/bgm.ts`, `assets/audio/bgm/`, `app/(tabs)/settings.tsx` の BGM_OPTIONS |
| アラーム音を複数化 | `bell.mp3` 1種のみ。選択UIは課金改修で一旦削除（"シンプルベル"固定表示） | 無料1種＋Pro複数種。Pro時のみ選択モーダルを復活 | `src/audio/alarm.ts`, `assets/audio/alarm/`, `settings.tsx`（ALARM_OPTIONS と SelectModal を再追加） |
| ダーク/ライトモード | 未実装（`colors.ts` に色定義はあるが切替ロジックなし）。設定の「テーマ」行も削除済み | テーマProvider＋AsyncStorage保存。仮眠中画面にも反映。Pro機能 | `src/theme/`, 全画面の色参照, `settings.tsx` にテーマ行復活 |

### Phase 2-B: 課金を買い切り＋サブスクの2本立てに

| タスク | 現状 | やること |
|---|---|---|
| サブスク商品の追加 | 買い切り `com.napfit.pro`（¥480）のみ | App Store Connect でサブスク商品を新規作成（**要: 価格・期間の決定**） |
| RevenueCat 対応 | Offering は買い切りのみ | Offering にサブスクを追加、`src/pro/{revenuecat,gate}.ts` を買い切りORサブスクの判定に対応 |
| 購入UIの2択化 | `pro-modal.tsx` は買い切り単独UI | 買い切り / サブスクを選べるUIに改修 |

### Phase 2-C: UI の妥協箇所を修正

- 実機（TestFlight / Expo Go）で見て気になる箇所を調整
  - カレンダーの羊画像（18px）が小さく潰れないか
  - 救済バナーの3択ボタン（羊16px＋テキスト横並び）が窮屈でないか
- `settings.tsx` の `v1.0.0` ハードコード表記 → 実バージョン（1.0.1）連動 or 動的取得
- その他、各画面の余白・文言・タップ領域の微調整

### Phase 3: 英語ローカライズ → 英語圏リリース

| タスク | 現状 | やること |
|---|---|---|
| 文言の i18n 化 | `src/i18n/ja.ts` は存在するが、各画面は文言を**ハードコード**している箇所が多い | 全画面の文言を i18n 経由に統一 |
| 英語リソース | 日本語のみ | `src/i18n/en.ts` を作成し全文翻訳。端末言語連動 or 言語切替 |
| ストアメタデータ | 日本語のみ | 英語のアプリ名・説明・キーワード・スクリーンショット |

### 任意: 開発効率

- **dev build 用ワークフロー**（internal distribution）。現状 `ios.yml` は App Store 配信用のみ。これがあれば課金・アラーム込みの全機能を実機ホットリロードで確認できる（日常のUI確認は Expo Go で代替可）

## 着手前に決めること

- **サブスクの価格・期間**（月額 / 年額、金額）
- **「アラーム」で増やすのは音源か信頼性か**（音源追加と解釈中。background audio の信頼性改善や AlarmKit 検討は別タスク）
- **英語対応の方式**（端末言語に自動追従 / 設定で手動切替）

## 既知の制約・注意点

- **BGMが完全に止まるとアラームが鳴らないリスク**（background audio方式の構造的限界。救済UXで補完）
- **Expo Go 非対応の機能**（IAP・アラームのバックグラウンド継続）。日常のUI確認は Expo Go（`npx expo start --tunnel`、WSL2のため tunnel 必須）、課金/アラームの最終確認は TestFlight
- 壊してはいけない実装パターンは [../CLAUDE.md](../CLAUDE.md) の「固有の厳守事項」に集約
- 次のストア更新時は `app.json` の `version` を上げる（ビルド番号はCI自動採番）
