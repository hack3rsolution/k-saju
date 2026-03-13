import Svg, { Path, Line } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function TravelIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.5L12 21 2 16.5M22 12L12 16.5 2 12M12 3L2 7.5 12 12 22 7.5 12 3Z"
        stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}
