# CLAUDE.md

NapFit は、仮眠後の気分（すっきり/ふつう/だるい）を記録して自分に合う仮眠時間を見つける iOS 専用アプリ（Expo + React Native + TypeScript）。タイマー→アラーム→3択記録→分析がコア体験。v1.0.0 リリース済みで、現在は Pro機能の拡充・課金拡張（買い切り＋サブスク）・英語対応へ向かう段階。

## ドキュメント索引

- 仕様の正: [docs/DESIGN.md](docs/DESIGN.md)（判断に迷ったら §16「開発時の判断方針」に従う）
- 運用の正: [docs/OPERATIONS.md](docs/OPERATIONS.md)（bundle id・課金ID・ビルド/配信・Secrets）
- 現状/残タスク: [docs/HANDOFF.md](docs/HANDOFF.md)
- UI方針: `mock.png`

## 固有の厳守事項

- **アラームの実装を壊さない**（`app/nap/active.tsx`）。background audio 方式のため以下は意図的：
  - `alarmFiredRef.current = true` を**同期的に**立ててから `fireAlarmAndNavigate()` を呼ぶ
  - その中の順序は `startAlarm()` → `stopBgm()`（逆にすると audio session が切れて鳴らない）
  - クリーンアップは `if (!alarmFiredRef.current) { stopAlarm(); }`（発火済みなら止めない＝wake画面で鳴らし続ける）
- `app/nap/_layout.tsx` の `SafeAreaProvider`、`app/{nap,onboarding}/_layout.tsx` の `headerShown: false` は意図的。消すとレイアウト崩れ・自動ヘッダー表示が起きる。
- 確認は **dev build か TestFlight**（Expo Go では background audio・IAP が動かない）。

## 作業ルール

- Phase 1（完了）→ Phase 2（機能完成・課金拡張）→ 英語対応 の順。詳細な現在地は HANDOFF。
- 各まとまった変更ごとに Git コミットする（コミットは日本語）。
- 仕様・課金・データ削除に関わる不明点は実装前に確認する。
