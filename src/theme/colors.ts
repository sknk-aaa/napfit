export type ThemeColors = {
  // ベース
  background: string;
  backgroundAlt: string;
  card: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  primaryChip: string;

  // 仮眠中
  napBackground: string;

  // 起床
  cream: string;
  yellowBtn: string;
  yellowBtnText: string;

  // テキスト
  ink: string;
  ink2: string;
  ink3: string;
  ink4: string;
  divider: string;

  // 結果
  freshBg: string;
  freshInk: string;
  normalBg: string;
  normalInk: string;
  sluggishBg: string;
  sluggishInk: string;

  // タブバー
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;

  // 後方互換
  text: string;
  textSecondary: string;
  textTertiary: string;
  surface: string;
  border: string;
  fresh: string;
  freshLight: string;
  normal: string;
  normalLight: string;
  sluggish: string;
  sluggishLight: string;
  alarmBackground: string;
};

export const lightColors: ThemeColors = {
  background: '#F5F0E8',
  backgroundAlt: '#EFE9DF',
  card: '#FFFFFF',
  primary: '#5E7BA8',
  primaryDark: '#4E6B95',
  primarySoft: '#E2EAF3',
  primaryChip: '#D4DFEC',

  napBackground: '#5E7BA8',

  cream: '#F6E9CC',
  yellowBtn: '#ECC97A',
  yellowBtnText: '#5C4A1F',

  ink: '#2E3A4F',
  ink2: '#6B7585',
  ink3: '#9BA3B0',
  ink4: '#C8CEDA',
  divider: '#ECE6DD',

  freshBg: '#E2ECDA',
  freshInk: '#6E8A5E',
  normalBg: '#F2E8CC',
  normalInk: '#A0833E',
  sluggishBg: '#F0DBD3',
  sluggishInk: '#A86F62',

  tabBar: '#FFFFFF',
  tabBarBorder: '#ECE6DD',
  tabActive: '#5E7BA8',
  tabInactive: '#9BA3B0',

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
};

// 和の落ち着きを保った温かいダーク。藍墨ベース＋オフホワイトの文字。
export const darkColors: ThemeColors = {
  background: '#15161C',
  backgroundAlt: '#1C1E26',
  card: '#23252F',
  primary: '#8AA6CE',
  primaryDark: '#7290BC',
  primarySoft: '#2A3242',
  primaryChip: '#36415A',

  napBackground: '#46587A',

  cream: '#2A2620',
  yellowBtn: '#ECC97A',
  yellowBtnText: '#3A2E12',

  ink: '#ECEAE3',
  ink2: '#AEB4BF',
  ink3: '#7C828D',
  ink4: '#4A4F59',
  divider: '#2E313B',

  freshBg: '#26342A',
  freshInk: '#9DBE8A',
  normalBg: '#33301F',
  normalInk: '#D6B260',
  sluggishBg: '#382722',
  sluggishInk: '#D49384',

  tabBar: '#1C1E26',
  tabBarBorder: '#2E313B',
  tabActive: '#8AA6CE',
  tabInactive: '#7C828D',

  text: '#ECEAE3',
  textSecondary: '#AEB4BF',
  textTertiary: '#7C828D',
  surface: '#1C1E26',
  border: '#2E313B',
  fresh: '#9DBE8A',
  freshLight: '#26342A',
  normal: '#D6B260',
  normalLight: '#33301F',
  sluggish: '#D49384',
  sluggishLight: '#382722',
  alarmBackground: '#2A2620',
};

// 後方互換: useTheme 未移行コードはこの静的 light を参照する（段階移行用）。
export const Colors = lightColors;
export type ColorKey = keyof ThemeColors;
