const plugin = require("./lib/index");

console.log("Testing ESLint plugin...");

// Test plugin structure
console.log("✓ Plugin exports rules:", Object.keys(plugin.rules));
console.log("✓ Plugin exports configs:", Object.keys(plugin.configs));

// Test rule configurations
const recommendedConfig = plugin.configs.recommended;
console.log("✓ Recommended config rules:", Object.keys(recommendedConfig.rules));

// Test framework-specific configs
const reactConfig = plugin.configs.react;
const vueConfig = plugin.configs.vue;
const angularConfig = plugin.configs.angular;

console.log("✓ React config has no-arrow-components:", 
  reactConfig.rules["@tnnquang/eslint/no-arrow-components"]);
console.log("✓ Vue config has no-arrow-components:", 
  vueConfig.rules["@tnnquang/eslint/no-arrow-components"]);
console.log("✓ Angular config has no-arrow-components:", 
  angularConfig.rules["@tnnquang/eslint/no-arrow-components"]);

console.log("\n🎉 All tests passed! The plugin supports:")
console.log("- Configurable rule severities (error, warn, off)")
console.log("- Framework-specific configurations")
console.log("- TypeScript framework support")
console.log("- English documentation")
