import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**", "tools/**", "scripts/**", "db/**", "tests/**"] },
];

export default config;
