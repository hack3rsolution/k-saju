import Svg, { Path, Rect } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function FamilyIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V10L12 3l9 7v11" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={9} y={14} width={6} height={7} rx={1} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}
