import Svg, { Path, Ellipse } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function MusicIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18V6l12-2v12" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={6} cy={18} rx={3} ry={2} stroke={color} strokeWidth={1.5} />
      <Ellipse cx={18} cy={16} rx={3} ry={2} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}
