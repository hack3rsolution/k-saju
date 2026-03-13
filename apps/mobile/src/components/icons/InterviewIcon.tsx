import Svg, { Path, Circle } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function InterviewIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 10.5C17 13 15.2 15 13 15.8V18l-2-1-2 1v-2.2C6.8 15 5 13 5 10.5 5 7.5 7.5 5 10 5s5 2.5 5 5z"
        stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M19 21c0-2.8-2-5-4-5.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
