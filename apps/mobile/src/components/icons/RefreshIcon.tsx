import Svg, { Path } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function RefreshIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Circular arc */}
      <Path
        d="M20,12 A8,8 0 1,1 14,4.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head */}
      <Path
        d="M14,2 L14,6 L18,5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
