import { Image, ImageStyle } from 'react-native';

type Pose = 'smile' | 'sleep' | 'pillow' | 'lie' | 'alert' | 'roll' | 'read';

const SOURCES: Record<Pose, ReturnType<typeof require>> = {
  smile:  require('@/assets/images/sheep/smile.png'),
  sleep:  require('@/assets/images/sheep/sleep.png'),
  pillow: require('@/assets/images/sheep/pillow.png'),
  lie:    require('@/assets/images/sheep/lie.png'),
  alert:  require('@/assets/images/sheep/alert.png'),
  roll:   require('@/assets/images/sheep/roll.png'),
  read:   require('@/assets/images/sheep/read.png'),
};

const WIDE_POSES: Pose[] = ['sleep', 'pillow', 'lie', 'roll', 'smile'];

interface Props {
  size?: number;
  pose?: Pose;
  style?: ImageStyle;
}

export default function Sheep({ size = 56, pose = 'smile', style }: Props) {
  const isWide = WIDE_POSES.includes(pose);
  const width = isWide ? size * 1.5 : size;
  return (
    <Image
      source={SOURCES[pose]}
      style={[{ width, height: undefined, aspectRatio: isWide ? 1.5 : 1 }, style]}
      resizeMode="contain"
    />
  );
}
