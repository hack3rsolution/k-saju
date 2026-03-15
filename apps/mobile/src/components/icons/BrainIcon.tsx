import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function BrainIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 왼쪽 반구 */}
      <Path
        d="M12,4 Q7,4 5,8 Q3,12 5,16 Q7,20 12,20"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 오른쪽 반구 */}
      <Path
        d="M12,4 Q17,4 19,8 Q21,12 19,16 Q17,20 12,20"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 중앙 세로선 */}
      <Line
        x1="12" y1="4" x2="12" y2="20"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* 왼쪽 주름 상단 */}
      <Path
        d="M12,9 Q9,9 8,11"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* 왼쪽 주름 하단 */}
      <Path
        d="M12,13 Q9,13 8,15"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* 오른쪽 주름 상단 */}
      <Path
        d="M12,9 Q15,9 16,11"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* 오른쪽 주름 하단 */}
      <Path
        d="M12,13 Q15,13 16,15"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
