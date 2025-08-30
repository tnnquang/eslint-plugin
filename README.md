# @tnnquang/eslint

ESLint plugin with custom rules for TypeScript frameworks including React, Vue, Angular, NestJS, Next.js, and Nuxt.

## Features

- `no-namespace-import`: Prevent namespace imports, encourage named imports with autofix
- `no-arrow-components`: Enforce function declarations over arrow functions for components
- `enforce-path-alias`: Enforce usage of path aliases based on tsconfig/vite configuration

## Installation

```bash
npm install --save-dev @tnnquang/eslint
```

## Usage

### Framework-Specific Configurations

Choose the configuration that matches your framework:

#### React/Next.js

```json
{
  "extends": ["plugin:@tnnquang/eslint/react"]
}
```

#### Vue/Nuxt

```json
{
  "extends": ["plugin:@tnnquang/eslint/vue"]
}
```

#### Angular

```json
{
  "extends": ["plugin:@tnnquang/eslint/angular"]
}
```

#### NestJS

```json
{
  "extends": ["plugin:@tnnquang/eslint/nestjs"]
}
```

#### General/Recommended

```json
{
  "extends": ["plugin:@tnnquang/eslint/recommended"]
}
```

#### Strict Mode

```json
{
  "extends": ["plugin:@tnnquang/eslint/strict"]
}
```

### Manual Configuration

```json
{
  "plugins": ["@tnnquang/eslint"],
  "rules": {
    "@tnnquang/eslint/no-arrow-components": "warn",
    "@tnnquang/eslint/no-namespace-import": "warn",
    "@tnnquang/eslint/enforce-path-alias": "warn"
  }
}
```

Each rule supports standard ESLint severity levels: `"off"`, `"warn"`, or `"error"`.

## Rules

### `@tnnquang/eslint/no-arrow-components`

Enforces function declarations for React components and top-level functions instead of arrow functions.

**Note**: This rule is automatically disabled for Vue, Angular, and NestJS configurations as these frameworks use different component patterns.

#### ❌ Incorrect

```javascript
// React components should be function declarations
const MyComponent = () => {
  return <div>Hello</div>;
};
```

// Top-level utility functions should be function declarations
const utilityFunction = (param) => {
  return param * 2;
};
```

#### ✅ Correct

```javascript
// Function declaration for React components
function MyComponent() {
  return <div>Hello</div>;
}

// Function declaration for utility functions
function utilityFunction(param) {
  return param * 2;
}

// Arrow functions are allowed when wrapped in HOCs
const MyMemoizedComponent = memo(() => {
  return <div>Hello</div>;
});

const MyForwardRefComponent = forwardRef(() => {
  return <div>Hello</div>;
});
```

### `@tnnquang/eslint/no-namespace-import`

Disallows using default imports as namespaces and encourages direct named imports. **Works with any library, not just React!**

#### Configuration Options

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "@tnnquang/eslint/no-namespace-import": [
      "error",
      {
        // Only check specific libraries
        targetLibraries: ["react", "lodash", "redux"],

        // Allow some libraries to use namespace imports
        allowedLibraries: ["moment", "dayjs"],
      },
    ],
  },
};
```

#### ❌ Incorrect

```javascript
import React from "react";
import _ from "lodash";
import Redux from "redux";
import moment from "moment";

function MyComponent() {
  const [state, setState] = React.useState(0);
  const data = _.map([1, 2, 3], (x) => x * 2);
  const store = Redux.createStore(reducer);
  const date = moment.format("YYYY-MM-DD");

  return <div>{state}</div>;
}
```

#### ✅ Correct (Auto-fixable)

```javascript
import { useState } from "react";
import { map } from "lodash";
import { createStore } from "redux";
import moment from "moment"; // Allowed in config

function MyComponent() {
  const [state, setState] = useState(0);
  const data = map([1, 2, 3], (x) => x * 2);
  const store = createStore(reducer);
  const date = moment.format("YYYY-MM-DD");

  return <div>{state}</div>;
}
```

#### Auto-fix Capability

This rule automatically fixes violations when you run:

```bash
eslint --fix your-file.js
```

### `@tnnquang/eslint/enforce-path-alias`

Enforces usage of path aliases for imports based on TypeScript or Vite configuration.

#### Configuration Options

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    "@tnnquang/eslint/enforce-path-alias": [
      "warn",
      {
        // Mode: "all" or "direct-children" (default)
        mode: "direct-children",
        
        // Config file to read (default: tsconfig.json)
        configFile: "tsconfig.json",
        
        // Base URL (auto-detected from config)
        baseUrl: "./src",
        
        // Folders to exclude from alias enforcement
        exclude: ["test", "spec"],
        
        // Manual path configuration (overrides auto-detection)
        paths: {
          "@/*": ["./src/*"],
          "@components/*": ["./src/components/*"],
          "@utils/*": ["./src/utils/*"]
        }
      }
    ]
  }
};
```

#### ❌ Incorrect

```javascript
// In src/components/Button.tsx
import { validateInput } from "../utils/validation";
import { API_URL } from "../config/constants";
```

#### ✅ Correct (Auto-fixable)

```javascript
// In src/components/Button.tsx
import { validateInput } from "@/utils/validation";
import { API_URL } from "@/config/constants";
```

#### Framework Support

This rule automatically detects configuration from:

- **TypeScript**: `tsconfig.json` paths mapping
- **Vite**: `vite.config.js/ts` alias configuration
- **Next.js**: Next.js project structure
- **Nuxt**: Nuxt project structure
- **Angular**: Angular workspace configuration

### TypeScript Configuration

For TypeScript projects, the plugin automatically detects `.ts` and `.tsx` files and applies enhanced rules:

```javascript
// .eslintrc.js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "@tnnquang/eslint"],
  extends: [
    "@typescript-eslint/recommended",
    "plugin:@tnnquang/eslint/react", // or your framework config
  ],
  rules: {
    // Enhanced TypeScript support
    "@tnnquang/eslint/no-arrow-components": [
      "warn",
      {
        allowArrowFunctions: false,
        checkTypeScript: true, // Enable TypeScript-specific checks
      },
    ],
    "@tnnquang/eslint/no-namespace-import": [
      "warn", 
      {
        checkTypeScriptTypes: true, // Check type imports
        allowTypeNamespaces: false, // Disallow type namespaces
        targetLibraries: ["react", "@types/node"],
      },
    ],
    "@tnnquang/eslint/enforce-path-alias": [
      "warn",
      {
        supportedExtensions: [".ts", ".tsx", ".js", ".jsx"],
        includeDeclarationFiles: false, // Skip .d.ts files
      },
    ],
  },
};
```

## Configuration Examples

### For React Projects

```javascript
// .eslintrc.js
module.exports = {
  extends: ["plugin:@tnnquang/eslint/recommended"],
  rules: {
    // Customize if needed
    "@tnnquang/eslint/no-arrow-components": "warn",
  },
};
```

### For General JavaScript Projects

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["@tnnquang/eslint"],
  rules: {
    "@tnnquang/eslint/no-namespace-import": [
      "error",
      {
        targetLibraries: ["lodash", "ramda", "rxjs"],
        allowedLibraries: ["moment", "dayjs"],
      },
    ],
  },
};
```

### With TypeScript

```javascript
// .eslintrc.js or eslint.config.js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "@tnnquang/eslint"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:@tnnquang/eslint/recommended",
  ],
};
```

## Why These Rules?

### Function Declarations Benefits

- **Hoisting**: Better code organization flexibility
- **Debugging**: Clearer stack traces
- **Consistency**: Uniform coding style
- **Performance**: Minor performance benefits

### Named Imports Benefits

- **Tree Shaking**: Better dead code elimination
- **Bundle Size**: Smaller production bundles
- **Clarity**: Explicit dependency tracking
- **Performance**: Faster bundling and optimization

## Supported Libraries

The `no-namespace-import` rule works with **any JavaScript library**:

- ✅ React (`React.useState` → `useState`)
- ✅ Lodash (`_.map` → `map`)
- ✅ Redux (`Redux.createStore` → `createStore`)
- ✅ RxJS (`Rx.Observable` → `Observable`)
- ✅ Ramda (`R.pipe` → `pipe`)
- ✅ Any other library with named exports

## License

MIT

## Contributing

Issues and pull requests are welcome!

Repository: [https://github.com/tnnquang/eslint-plugin](https://github.com/tnnquang/eslint-plugin)

## Changelog

### v2.0.0

- **Enhanced TypeScript Support**: All rules now have improved TypeScript detection and support
- Added TypeScript type definitions (`lib/index.d.ts`)
- Enhanced `no-arrow-components` with TypeScript component detection and configurable options
- Enhanced `no-namespace-import` with TypeScript type import support and type namespace options
- Enhanced `enforce-path-alias` with TypeScript file extension support and declaration file handling
- Added comprehensive TypeScript configuration examples
- Added support for `.ts`, `.tsx`, `.vue`, `.svelte` file extensions
- Improved auto-detection of project structure for TypeScript projects

## Author

Tran Ngoc Nhat Quang
