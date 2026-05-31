# NapFit

仮眠後の気分を記録して、自分に合う仮眠時間を見つける iOS アプリ（Expo / React Native）。
タイマー → アラーム → 3択記録 → 分析、というコア体験を中心にした、日本の社会人向けのパワーナップ・アプリ。App Store でリリース済み（v1.0.0）。

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [docs/DESIGN.md](docs/DESIGN.md) | 仕様の正（コンセプト・データモデル・画面仕様・判断方針） |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | 運用の正（bundle id・課金・ビルド/配信・Secrets） |
| [docs/HANDOFF.md](docs/HANDOFF.md) | 現状・残タスク・既知の問題 |
| [CLAUDE.md](CLAUDE.md) | AI（Claude Code）向けの入口・固有の厳守事項 |

## 開発

```bash
npm install
npx expo start            # dev build で確認（Expo Go 非対応）
npx tsc --noEmit          # 型チェック
```

## ビルド / 配信

GitHub Actions + fastlane（無料）。詳細は [docs/OPERATIONS.md](docs/OPERATIONS.md)。

- Actions → 「iOS TestFlight」を実行 → TestFlight へ配信
