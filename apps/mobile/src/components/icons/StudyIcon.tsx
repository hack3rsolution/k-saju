import Svg, { Path, Line } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function StudyIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 9L12 5 2 9l10 4 10-4z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 11.5v5C8 18.5 10 19 12 19s4-.5 6-2.5v-5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={22} y1={9} x2={22} y2={15} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
