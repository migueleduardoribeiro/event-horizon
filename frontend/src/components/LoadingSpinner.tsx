"use client";

export default function LoadingSpinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="spinner inline-block"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
