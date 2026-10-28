export const THEMES = {
  burgundy: {
    bg: "radial-gradient(110% 90% at 100% 0%, color-mix(in oklab, var(--rose) 45%, transparent), transparent 60%), linear-gradient(160deg, var(--burgundy) 0%, color-mix(in oklab, var(--burgundy) 68%, black) 100%)",
    shadow:
      "0 28px 48px -28px color-mix(in oklab, var(--burgundy) 65%, transparent)",
  },
  navy: {
    bg: "radial-gradient(110% 90% at 100% 0%, color-mix(in oklab, var(--rose) 32%, transparent), transparent 60%), linear-gradient(160deg, var(--navy) 0%, color-mix(in oklab, var(--navy) 62%, black) 100%)",
    shadow:
      "0 28px 48px -28px color-mix(in oklab, var(--navy) 65%, transparent)",
  },
  olive: {
    bg: "radial-gradient(110% 90% at 100% 0%, color-mix(in oklab, var(--sage) 50%, transparent), transparent 60%), linear-gradient(160deg, var(--olive) 0%, color-mix(in oklab, var(--olive) 66%, black) 100%)",
    shadow:
      "0 28px 48px -28px color-mix(in oklab, var(--olive) 65%, transparent)",
  },
} as const;
