export const ja = {
  app: {
    name: 'NapFit',
    subtitle: 'あなたに合う仮眠時間がわかる',
  },

  tabs: {
    home: 'ホーム',
    history: '履歴',
    settings: '設定',
  },

  home: {
    startButton: '仮眠をはじめる',
    customTimeLink: 'カスタム時間を設定',
    keepScreenOn: 'この画面を開いたままにしてください',
    napDurationOptions: ['15分', '20分', '30分'],
    recommendCard: {
      title: 'あなたのおすすめ仮眠時間',
      unit: '分',
      notEnoughData: '記録を続けると、あなたのおすすめ仮眠時間が表示されます',
      proLink: 'もっと詳しく見る(Pro)',
    },
  },

  napActive: {
    keepScreenOn: 'この画面を開いたままにしてください',
    bgmPlaying: 'BGM再生中',
    stopButton: '中断する',
    interruptConfirmTitle: '仮眠を中断しますか?',
    interruptConfirmStop: '中断',
    interruptConfirmContinue: '続ける',
  },

  napWake: {
    phase1Title: 'おはようございます！',
    phase1Subtitle: '起きる時間です',
    stopAlarmButton: 'アラームを止める',
    skipLink: 'スキップ(記録しない)',
    skipNote: 'スキップしても、仮眠の記録は残ります',
    phase2Title: '起きた感じを教えてください',
    phase2Subtitle: '今日のコンディションを記録しましょう',
    resultNote: '記録すると、あなたに合う仮眠時間が見えてきます',
    recordedToast: '記録しました',
  },

  results: {
    fresh: 'すっきり',
    freshDesc: 'よく休めた気がする',
    normal: '普通',
    normalDesc: 'ふつう',
    sluggish: 'だるい',
    sluggishDesc: 'まだ眠い・重い感じ',
    skipped: '—',
    interrupted: '中断',
  },

  history: {
    title: '履歴',
    summary: '直近10回のまとめ',
    emptyMessage: '仮眠の記録がありません',
    proCtaMessage: '無制限の履歴を見る(Pro)',
  },

  settings: {
    title: '設定',
    bgmTitle: 'BGM',
    notificationTitle: '通知',
    notificationEnabled: '通知が許可されています',
    notificationDisabled: '通知が許可されていません',
    notificationGoToSettings: 'OS設定を開く',
    privacyPolicy: 'プライバシーポリシー',
    termsOfService: '利用規約',
    appInfo: 'アプリ情報',
    proPurchase: 'NapFit Pro - 機能をアップグレード',
    proRestore: '購入を復元',
    proMember: 'Pro メンバー',
  },

  recovery: {
    bannerTitle: (minutesAgo: string, duration: number) =>
      `${minutesAgo}前の${duration}分仮眠が記録されていません`,
    bannerQuestion: 'どうでしたか?',
    skipButton: 'スキップ',
  },

  comments: {
    noRecord: '仮眠を記録すると、自分に合う時間が分かります',
    fewRecords1_2: '記録を続けると、あなたに合う仮眠時間が見えてきます',
    fewRecords3_4: (remaining: number) => `あと${remaining}回記録すると、傾向が見えてきます`,
    freshStreak: (count: number) => `最近${count}回はすっきりが続いています`,
    sluggishStreak: (count: number) => `最近${count}回はだるい結果が多めです`,
    normalStreak: (count: number) => `最近${count}回は普通が多めです`,
    bestTime: (minutes: number) => `これまでで一番すっきりだったのは${minutes}分仮眠です`,
    freshMany: (minutes: number, count: number, total: number) =>
      `${minutes}分仮眠は${total}回中${count}回すっきりです`,
    sluggishMany: (minutes: number, count: number, total: number) =>
      `${minutes}分仮眠は${total}回中${count}回だるい結果でした`,
    normalMany: (minutes: number, count: number, total: number) =>
      `${minutes}分仮眠は${total}回中${count}回普通でした`,
  },

  errors: {
    generic: 'エラーが発生しました。もう一度お試しください。',
    notificationPermissionDenied: '通知が許可されていません。設定から通知を許可してください。',
  },
} as const;
