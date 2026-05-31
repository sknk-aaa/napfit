# HANDOFF

現状・残タスク・既知の問題。仕様は [DESIGN.md](./DESIGN.md)、運用値は [OPERATIONS.md](./OPERATIONS.md) を参照。

## 現在地

- **v1.0.0 を App Store にリリース済み**。v1.0.1 を TestFlight で検証中。
- ビルドは GitHub Actions + fastlane に移行**完了**。
- **UIの大改修を実施済み（下記）**。次のストア更新（v1.1.0 想定）に向けた状態。

## 今セッションで完了（コード側）

| 項目 | 内容 |
|---|---|
| 絵文字の一掃 | 全画面の絵文字を Ionicons＋羊画像に置換 |
| **ダークモード** | `src/theme` を light/dark 2パレット＋`ThemeProvider`/`useThemedStyles` 化。**全画面をテーマ対応**（`Colors.` 直接参照ゼロを grep で確認）。画面遷移の地色もテーマ追従 |
| **英語対応** | `src/i18n` に en 辞書＋`LocaleProvider`/`useT`。**全画面の文言を i18n 化**。端末言語追従＋手動切替の両対応（`expo-localization`） |
| 設定画面 | テーマ切替（端末追従/ライト/ダーク）・言語切替（端末追従/日本語/English）を追加（どちらも無料）。バージョンは `expo-constants` から動的取得 |
| **サブスク対応コード** | `getProPlans` が Offering の package を `productCategory` で月額/買い切りに自動振り分け。`pro-modal` を2択UI化。価格は `priceString` で自動表示（コードに金額を持たない） |

## あなたの作業（コードでは完結しない）

1. **App Store Connect / RevenueCat**
   - 月額サブスク商品を作成（**¥400／月**）
   - 買い切りの価格を **¥480 → ¥1800** に改定（商品ID `com.napfit.pro` のまま）
   - RevenueCat の current Offering に「月額サブスク」と「買い切り」両方の package を追加し、どちらも entitlement `pro` に紐付け
   - → これで pro-modal に2プランが自動表示される（未設定なら買い切りのみ表示にフォールバック）
2. **音源の追加**（自分でやると決定済み）
   - BGM を `src/audio/bgm.ts`＋`assets/audio/bgm/`＋設定の `BGM_OPTIONS` に追加
   - アラーム音を `src/audio/alarm.ts`＋`assets/audio/alarm/` に追加（Pro複数化するなら設定に選択UI復活）
3. **実機確認**（私はスクショ不可）
   - ダーク表示の崩れ・コントラスト（色は `src/theme/colors.ts` の `darkColors` で微調整可。気になれば指示を）
   - 英語表示のレイアウト崩れ（長い英文での折り返し等）
   - 確認は Expo Go（`npx expo start --tunnel`）→ 設定でテーマ/言語を切り替えて確認
4. **配信**: `git push` → CI で TestFlight → ストア更新時は `app.json` の `version` を上げる

## 残（コード・任意）

- **デザインの大幅刷新**: テーマ基盤が整ったので、この上でレイアウト・タイポ・モーションの作り込みを継続可能（今回は構造維持でテーマ化＋英語化を優先した）
- dev build 用ワークフロー（全機能を実機ホットリロード確認）

## 既知の制約・注意点

- **BGMが完全に止まるとアラームが鳴らないリスク**（background audio方式の構造的限界。救済UXで補完）
- **Expo Go 非対応**: IAP・アラームのバックグラウンド継続。最終確認は TestFlight
- 壊してはいけない実装パターンは [../CLAUDE.md](../CLAUDE.md) の「固有の厳守事項」に集約
- テーマ切替は無料開放にした（ダークを有料にする低評価リスク回避。Pro差別化は分析・無制限履歴・カレンダー・エクスポート側）
