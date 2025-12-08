import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  // Ignore build artifacts
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**'],
  },

  // Next.js + React Core Web Vitals rules
  ...nextCoreWebVitals,
];

export default config;
