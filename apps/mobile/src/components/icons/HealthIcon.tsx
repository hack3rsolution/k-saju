import Svg, { Path } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function HealthIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12h4l3-7 4 14 3-9 2 2h4"
        stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}
