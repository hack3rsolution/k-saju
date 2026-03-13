import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function CompatibilityIcon({ color, size = 28 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={9}
        cy={12}
        r={7}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={15}
        cy={12}
        r={7}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
