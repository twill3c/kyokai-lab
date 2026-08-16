// フッタリンク(F-09)。鍛え方=操作説明・設計図はアーティファクト(要共有リンク)。

export interface FooterLink {
  label: string;
  href: string;
}

export const FOOTER_LINKS: readonly FooterLink[] = [
  {
    label: "MIT License",
    href: "https://github.com/twill3c/kyokai-lab/blob/main/LICENSE",
  },
  { label: "GitHub", href: "https://github.com/twill3c/kyokai-lab" },
  {
    label: "kyokai-lab の鍛え方",
    href: "https://claude.ai/code/artifact/2c032116-4ea1-4013-997c-ea2a0bbee610",
  },
  {
    label: "kyokai-lab 設計図",
    href: "https://claude.ai/code/artifact/23582609-96bc-4593-ad14-2a3fd01c37cc",
  },
  { label: "App Menu", href: "https://app-menu-amber.vercel.app" },
] as const;
