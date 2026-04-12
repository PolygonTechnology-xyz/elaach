// plane imports
import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function RetroIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ 
          flexShrink: 0,
          display: "block",
          transform: "rotate(0deg)"
        }}
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M3 10h18" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="m9 16 3 3 5-5" />
      </svg>
    </IconWrapper>
  );
}