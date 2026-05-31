# HANDOFF

現状・残タスク・既知の問題。仕様は [DESIGN.md](./DESIGN.md)、運用値は [OPERATIONS.md](./OPERATIONS.md) を参照（ここには重複させない）。

## 現在地

- **v1.0.0 を App Store にリリース済み**（Phase 1 MVP 完了）
- ビルドを EAS → GitHub Actions + fastlane に移行済み（[OPERATIONS.md](./OPERATIONS.md) 参照）

## 今後の方針（ユーザー決定）

この順序で進める：

1. **機能を完成させ切る**（Phase 2 / Pro機能・後述の未実装分）
2. **課金を買い切り＋サブスクの2本立てに**（現状は買い切りのみ）
3. **UIの妥協箇所を修正**
4. **英語ローカライズを追加 → 英語圏向けにリリース**（`src/i18n/` は分離済みで準備済み。日本語は維持）

> 日本語UIのまま英語ストア表示だった影響で初日CTRが約1%。日本語化より「機能完成→多言語展開」を優先する判断。

## 未実装・要拡充（設計書 §4 との差分）

| 項目 | 現状 | あるべき姿 |
|---|---|---|
| BGM音源 | `rain.mp3` の1種のみ | 厳選2〜3種（`src/audio/bgm.ts`） |
| アラーム音 | `bell.mp3` の1種のみ。設定UIの枠はあるが空 | 無料1種＋Pro複数種（`src/audio/alarm.ts`は切替対応済み） |
| ダーク/ライトモード | 未実装（色定義のみ存在） | Pro機能。仮眠中画面にも反映 |
| サブスク課金 | 未実装（買い切りのみ） | 買い切りと併存 |

それ以外（分析ダッシュボード/診断レポート/無制限履歴+カレンダー/CSV・JSONエクスポート/救済UX/簡単コメント/オンボーディング/RevenueCat買い切り）は実装済み。

## 既知の制約・注意点

- **BGMが完全に止まるとアラームが鳴らないリスク**（background audio方式の構造的限界。救済UXで補完）
- **Expo Go 非対応**（background audio・IAP等が動かない）。確認は dev build か TestFlight
- RevenueCat の Sandbox テストは実機 dev build でのみ可能
- 壊してはいけない実装パターンは [../CLAUDE.md](../CLAUDE.md) の「固有の厳守事項」に集約
