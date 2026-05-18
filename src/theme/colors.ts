export const Colors = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  primary: '#5B9BD5',
  primaryDark: '#3A7DBF',

  napBackground: '#E8F4F8',

  text: '#2C2C2C',
  textSecondary: '#666666',
  textTertiary: '#999999',

  border: '#E5E5E5',

  fresh: '#4CAF50',
  freshLight: '#E8F5E9',
  normal: '#FFC107',
  normalLight: '#FFF8E1',
  sluggish: '#F44336',
  sluggishLight: '#FFEBEE',

  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E5E5',
  tabActive: '#5B9BD5',
  tabInactive: '#AAAAAA',

  alarmBackground: '#FFF8E1',
} as const;

export type ColorKey = keyof typeof Colors;
