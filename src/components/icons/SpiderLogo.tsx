import React from "react";

export function SpiderLogo({
  className = "w-5 h-5",
  glow = false,
}: {
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? "filter drop-shadow-[0_0_8px_rgba(226,36,36,0.6)]" : ""}`}
    >
      {/* Central Head & Thorax */}
      <path
        d="M12 2.5L13.8 5.2L12 6.8L10.2 5.2L12 2.5Z"
        fill="currentColor"
      />
      <path
        d="M12 7.2L14.5 10.2L12 14.8L9.5 10.2L12 7.2Z"
        fill="currentColor"
      />
      {/* Abdomen / Lower Body */}
      <path
        d="M12 15.5L14 18.2L12 21.5L10 18.2L12 15.5Z"
        fill="currentColor"
      />

      {/* Upper Left Legs */}
      <path
        d="M10 8.5L5.5 4.5L3 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.8 10.5L4.5 9L2 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower Left Legs */}
      <path
        d="M10 13L4.8 15L3.2 18.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.8 16.5L6.5 20.2L6 22.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Upper Right Legs */}
      <path
        d="M14 8.5L18.5 4.5L21 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.2 10.5L19.5 9L22 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower Right Legs */}
      <path
        d="M14 13L19.2 15L20.8 18.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 16.5L17.5 20.2L18 22.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
