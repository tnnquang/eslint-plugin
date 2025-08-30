const noArrowComponents = require("./rules/no-arrow-components");
const noNamespaceImport = require("./rules/no-namespace-import");
const enforcePathAlias = require("./rules/enforce-path-alias");

module.exports = {
  rules: {
    "no-arrow-components": noArrowComponents,
    "no-namespace-import": noNamespaceImport,
    "enforce-path-alias": enforcePathAlias,
  },
  configs: {
    recommended: {
      plugins: ["@tnnquang/eslint"],
      rules: {
        "@tnnquang/eslint/no-arrow-components": "warn",
        "@tnnquang/eslint/no-namespace-import": "warn",
        "@tnnquang/eslint/enforce-path-alias": "warn",
      },
    },
    strict: {
      plugins: ["@tnnquang/eslint"],
      rules: {
        "@tnnquang/eslint/no-arrow-components": "error",
        "@tnnquang/eslint/no-namespace-import": "error",
        "@tnnquang/eslint/enforce-path-alias": "error",
      },
    },
    react: {
      plugins: ["@tnnquang/eslint"],
      rules: {
        "@tnnquang/eslint/no-arrow-components": "warn",
        "@tnnquang/eslint/no-namespace-import": "warn",
        "@tnnquang/eslint/enforce-path-alias": "warn",
      },
    },
    vue: {
      plugins: ["@tnnquang/eslint"],
      rules: {
        "@tnnquang/eslint/no-arrow-components": "off", // Vue components use different patterns
        "@tnnquang/eslint/no-namespace-import": "warn",
        "@tnnquang/eslint/enforce-path-alias": "warn",
      },
    },
    angular: {
      plugins: ["@tnnquang/eslint"],
      rules: {
        "@tnnquang/eslint/no-arrow-components": "off", // Angular uses classes
        "@tnnquang/eslint/no-namespace-import": "warn",
        "@tnnquang/eslint/enforce-path-alias": "warn",
      },
    },
    nestjs: {
      plugins: ["@tnnquang/eslint"],
      rules: {
        "@tnnquang/eslint/no-arrow-components": "off", // NestJS uses decorators and classes
        "@tnnquang/eslint/no-namespace-import": "warn",
        "@tnnquang/eslint/enforce-path-alias": "warn",
      },
    },
    nextjs: {
      plugins: ["@tnnquang/eslint"],
      rules: {
        "@tnnquang/eslint/no-arrow-components": "warn",
        "@tnnquang/eslint/no-namespace-import": "warn",
        "@tnnquang/eslint/enforce-path-alias": "warn",
      },
    },
    nuxt: {
      plugins: ["@tnnquang/eslint"],
      rules: {
        "@tnnquang/eslint/no-arrow-components": "off", // Nuxt uses Vue components
        "@tnnquang/eslint/no-namespace-import": "warn",
        "@tnnquang/eslint/enforce-path-alias": "warn",
      },
    },
  },
};
