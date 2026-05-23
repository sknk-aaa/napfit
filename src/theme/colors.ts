export const Colors = {
  // ベース
  background: '#F5F0E8',
  backgroundAlt: '#EFE9DF',
  card: '#FFFFFF',
  primary: '#5E7BA8',
  primaryDark: '#4E6B95',
  primarySoft: '#E2EAF3',
  primaryChip: '#D4DFEC',

  // 仮眠中
  napBackground: '#5E7BA8',

  // 起床
  cream: '#F6E9CC',
  yellowBtn: '#ECC97A',
  yellowBtnText: '#5C4A1F',

  // テキスト
  ink: '#2E3A4F',
  ink2: '#6B7585',
  ink3: '#9BA3B0',
  ink4: '#C8CEDA',
  divider: '#ECE6DD',

  // 結果
  freshBg: '#E2ECDA',
  freshInk: '#6E8A5E',
  normalBg: '#F2E8CC',
  normalInk: '#A0833E',
  sluggishBg: '#F0DBD3',
  sluggishInk: '#A86F62',

  // タブバー
  tabBar: '#FFFFFF',
  tabBarBorder: '#ECE6DD',
  tabActive: '#5E7BA8',
  tabInactive: '#9BA3B0',

  // 後方互換
  text: '#2E3A4F',
  textSecondary: '#6B7585',
  textTertiary: '#9BA3B0',
  surface: '#EFE9DF',
  border: '#ECE6DD',
  fresh: '#6E8A5E',
  freshLight: '#E2ECDA',
  normal: '#A0833E',
  normalLight: '#F2E8CC',
  sluggish: '#A86F62',
  sluggishLight: '#F0DBD3',
  alarmBackground: '#F6E9CC',
} as const;

export type ColorKey = keyof typeof Colors;
