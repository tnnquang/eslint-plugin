const path = require("path");
const fs = require("fs");

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce usage of path aliases for imports based on tsconfig/vite config",
      category: "Best Practices",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          // Configuration mode for alias enforcement
          mode: {
            type: "string",
            enum: ["all", "direct-children"],
            default: "direct-children",
          },
          // Automatically read from tsconfig.json
          configFile: {
            type: "string",
            default: "tsconfig.json",
          },
          // Manual configuration paths
          paths: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { type: "string" },
            },
          },
          // Base URL (usually src/)
          baseUrl: {
            type: "string",
            default: "./src",
          },
          // Excluded folders that don't require aliases
          exclude: {
            type: "array",
            items: { type: "string" },
            default: [],
          },
          // Support for TypeScript file extensions
          supportedExtensions: {
            type: "array",
            items: { type: "string" },
            default: [".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte"],
          },
          // Check TypeScript declaration files
          includeDeclarationFiles: {
            type: "boolean",
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const mode = options.mode || "direct-children";
    const configFile = options.configFile || "tsconfig.json";
    const manualPaths = options.paths;
    const userBaseUrl = options.baseUrl;
    const fallbackBaseUrl = options.fallbackBaseUrl || "./src";
    const excludeFolders = options.exclude || [];
    const supportedExtensions = options.supportedExtensions || [".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte"];
    const includeDeclarationFiles = options.includeDeclarationFiles || false;

    // Check if current file is supported
    const filename = context.getFilename();
    const isTypeScript = /\.(ts|tsx)$/.test(filename);
    const isDeclarationFile = /\.d\.ts$/.test(filename);
    
    // Skip declaration files unless explicitly included
    if (isDeclarationFile && !includeDeclarationFiles) {
      return {};
    }

    // Check if file extension is supported
    const fileExtension = supportedExtensions.find(ext => filename.endsWith(ext));
    if (!fileExtension) {
      return {};
    }

    // Auto-detect baseUrl from tsconfig or vite config
    function detectBaseUrl() {
      if (userBaseUrl) return userBaseUrl; // User has manually set baseUrl

      const projectRoot = context.getCwd();

      // Try to read from tsconfig.json to get baseUrl
      const tsconfigPath = path.join(projectRoot, configFile);
      if (fs.existsSync(tsconfigPath)) {
        try {
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
          if (tsconfig.compilerOptions?.baseUrl) {
            return tsconfig.compilerOptions.baseUrl;
          }
        } catch (error) {
          // Ignore
        }
      }

      // Check common directories for TypeScript projects
      const commonDirs = isTypeScript ? ["src", "lib", "app", "."] : ["src", "app", "lib", "."];
      for (const dir of commonDirs) {
        const dirPath = path.join(projectRoot, dir === "." ? "" : dir);
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
          // Check if there are JS/TS files in this directory
          const files = fs.readdirSync(dirPath);
          const hasSourceFiles = files.some(
            (file) => supportedExtensions.some(ext => file.endsWith(ext)) && !file.startsWith(".")
          );
          if (hasSourceFiles || dir === "src" || dir === "app") {
            return dir === "." ? "./" : `./${dir}`;
          }
        }
      }

      return fallbackBaseUrl;
    }

    function resolveProjectReferences(tsconfigPath) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
        const projectRoot = path.dirname(tsconfigPath);

        if (tsconfig.references) {
          const allPaths = {};

          if (tsconfig.compilerOptions?.paths) {
            Object.assign(allPaths, tsconfig.compilerOptions.paths);
          }

          for (const ref of tsconfig.references) {
            const refPath = path.resolve(projectRoot, ref.path);
            const refTsconfigPath =
              fs.existsSync(refPath) && fs.statSync(refPath).isFile()
                ? refPath
                : path.join(refPath, "tsconfig.json");

            if (fs.existsSync(refTsconfigPath)) {
              try {
                const refTsconfig = JSON.parse(
                  fs.readFileSync(refTsconfigPath, "utf8")
                );
                if (refTsconfig.compilerOptions?.paths) {
                  Object.assign(allPaths, refTsconfig.compilerOptions.paths);
                }
              } catch (error) {
                // Ignore reference tsconfig errors
              }
            }
          }

          return allPaths;
        }

        return tsconfig.compilerOptions?.paths || {};
      } catch (error) {
        return {};
      }
    }

    function getPathMappings() {
      if (manualPaths) {
        return manualPaths;
      }

      const projectRoot = context.getCwd();

      const tsconfigPath = path.join(projectRoot, configFile);
      if (fs.existsSync(tsconfigPath)) {
        const paths = resolveProjectReferences(tsconfigPath);
        if (Object.keys(paths).length > 0) {
          return paths;
        }
      }

      // Try read vite.config.js/ts
      const viteConfigPaths = [
        path.join(projectRoot, "vite.config.js"),
        path.join(projectRoot, "vite.config.ts"),
        path.join(projectRoot, "vite.config.mjs"),
        path.join(projectRoot, "vite.config.mts"),
      ];

      for (const viteConfigPath of viteConfigPaths) {
        if (fs.existsSync(viteConfigPath)) {
          try {
            const viteConfig = fs.readFileSync(viteConfigPath, "utf8");
            const patterns = [
              /alias\s*:\s*{([^}]+)}/s,
              /resolve\s*:\s*{[^}]*alias\s*:\s*{([^}]+)}/s,
            ];

            for (const pattern of patterns) {
              const aliasMatch = viteConfig.match(pattern);
              if (aliasMatch) {
                const aliases = {};
                const aliasContent = aliasMatch[1];

                // Handle different formats
                const aliasRegexes = [
                  // '@': path.resolve(__dirname, 'src')
                  /['"`](@[^'"`]+)['"`]\s*:\s*path\.resolve\([^,)]*,\s*['"`]([^'"`]+)['"`]\)/g,
                  // '@': './src'
                  /['"`](@[^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/g,
                  // '~': path.join(__dirname, 'app')
                  /['"`](~[^'"`]*)['"`]\s*:\s*path\.\w+\([^,)]*,\s*['"`]([^'"`]+)['"`]\)/g,
                ];

                for (const aliasRegex of aliasRegexes) {
                  let match;
                  while ((match = aliasRegex.exec(aliasContent)) !== null) {
                    const aliasKey = match[1];
                    const aliasPath = match[2];

                    // Handle relative path
                    const normalizedPath = aliasPath.startsWith("./")
                      ? aliasPath
                      : `./${aliasPath}`;
                    aliases[aliasKey + "/*"] = [normalizedPath + "/*"];
                  }
                }

                if (Object.keys(aliases).length > 0) {
                  return aliases;
                }
              }
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }

      return {};
    }

    // Detect baseUrl after having context
    const finalBaseUrl = detectBaseUrl();

    // Convert path mapping to regex patterns
    function createAliasPatterns(pathMappings) {
      const patterns = [];

      for (const [alias, targets] of Object.entries(pathMappings)) {
        const aliasPattern = alias.replace("/*", "");
        const targetPath = targets[0]?.replace("/*", "") || "";

        patterns.push({
          alias: aliasPattern,
          targetPath: path.resolve(context.getCwd(), finalBaseUrl, targetPath),
          aliasRegex: new RegExp(`^${aliasPattern.replace("*", ".*")}`),
        });
      }

      return patterns;
    }

    // Check if file is in direct children of src
    function isDirectChildOfSrc(filePath) {
      const srcPath = path.resolve(context.getCwd(), finalBaseUrl);
      const relativePath = path.relative(srcPath, filePath);
      const pathParts = relativePath.split(path.sep);

      // Only 1 level (direct child)
      return pathParts.length === 2 && !relativePath.startsWith("..");
    }

    // Check if import should be replaced with alias
    function shouldUseAlias(importPath, currentFilePath) {
      // Skip relative imports that aren't ../
      if (!importPath.startsWith("../") && !importPath.startsWith("./")) {
        return false;
      }

      // Skip excluded folders
      const resolvedImportPath = path.resolve(
        path.dirname(currentFilePath),
        importPath
      );
      const relativeToCwd = path.relative(context.getCwd(), resolvedImportPath);

      for (const excludeFolder of excludeFolders) {
        if (relativeToCwd.startsWith(excludeFolder)) {
          return false;
        }
      }

      if (mode === "direct-children") {
        return isDirectChildOfSrc(resolvedImportPath);
      }

      // mode === 'all'
      const srcPath = path.resolve(context.getCwd(), finalBaseUrl);
      return resolvedImportPath.startsWith(srcPath);
    }

    // Find matching alias for import path
    function findMatchingAlias(importPath, currentFilePath, patterns) {
      const resolvedImportPath = path.resolve(
        path.dirname(currentFilePath),
        importPath
      );

      for (const pattern of patterns) {
        if (resolvedImportPath.startsWith(pattern.targetPath)) {
          const relativePath = path.relative(
            pattern.targetPath,
            resolvedImportPath
          );
          return `${pattern.alias}/${relativePath}`.replace(/\\/g, "/");
        }
      }

      return null;
    }

    const pathMappings = getPathMappings();
    const aliasPatterns = createAliasPatterns(pathMappings);

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        const currentFilePath = context.getFilename();

        if (shouldUseAlias(importPath, currentFilePath)) {
          const suggestedAlias = findMatchingAlias(
            importPath,
            currentFilePath,
            aliasPatterns
          );

          if (suggestedAlias) {
            context.report({
              node: node.source,
              message: `Use path alias '${suggestedAlias}' instead of relative import '${importPath}'`,
              fix(fixer) {
                return fixer.replaceText(node.source, `'${suggestedAlias}'`);
              },
            });
          }
        }
      },

      // Support require() statements
      CallExpression(node) {
        if (
          node.callee.name === "require" &&
          node.arguments.length === 1 &&
          node.arguments[0].type === "Literal"
        ) {
          const importPath = node.arguments[0].value;
          const currentFilePath = context.getFilename();

          if (shouldUseAlias(importPath, currentFilePath)) {
            const suggestedAlias = findMatchingAlias(
              importPath,
              currentFilePath,
              aliasPatterns
            );

            if (suggestedAlias) {
              context.report({
                node: node.arguments[0],
                message: `Use path alias '${suggestedAlias}' instead of relative require '${importPath}'`,
                fix(fixer) {
                  return fixer.replaceText(
                    node.arguments[0],
                    `'${suggestedAlias}'`
                  );
                },
              });
            }
          }
        }
      },
    };
  },
};
