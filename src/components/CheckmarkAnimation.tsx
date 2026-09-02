"use client";

export function CheckmarkAnimation() {
  return (
    <div className="flex items-center justify-center animate-scale-check">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-emerald-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            className="animate-draw-check"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>
  );
}
