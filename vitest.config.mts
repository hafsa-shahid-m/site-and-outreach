import { defineConfig } from "vitest/config";

// next/font only works inside the Next.js compiler. In the unit tests, this plugin swaps each
// "import { Family } from 'next/font/google'" for a stand-in, so app/layout.tsx can be tested with any family.
const stubNextFont = {
  name: "stub-next-font",
  enforce: "pre" as const,
  transform(code: string) {
    if (!code.includes("next/font/google")) return null;
    return code.replace(/import\s*\{([^}]*)\}\s*from\s*["']next\/font\/google["'];?/g, (_match, names: string) =>
      names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n) => {
          const [name, alias] = n.split(/\s+as\s+/);
          return `const ${alias ?? name} = () => ({ className: "font", variable: "--font-test", style: { fontFamily: "test" } });`;
        })
        .join("\n"),
    );
  },
};

export default defineConfig({
  plugins: [stubNextFont],
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/helpers/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
