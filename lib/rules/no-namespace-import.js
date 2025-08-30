/**
 * @fileoverview Disallows using default imports as namespaces
 * and encourages direct named imports, with autofix.
 */

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow using default imports as namespaces, encourage named imports, and provide autofix.",
      category: "Best Practices",
      recommended: false,
      url: "https://github.com/tnnquang/eslint-plugin#no-namespace-import",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          allowedLibraries: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "List of libraries that are allowed to use namespace imports",
          },
          targetLibraries: {
            type: "array",
            items: {
              type: "string",
            },
            description:
              "List of libraries to check for namespace usage (if empty, checks all libraries)",
          },
          checkTypeScriptTypes: {
            type: "boolean",
            default: true,
            description: "Check TypeScript type imports for namespace usage"
          },
          allowTypeNamespaces: {
            type: "boolean", 
            default: false,
            description: "Allow namespace imports for TypeScript type-only imports"
          }
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noNamespaceUsage:
        "Do not use default import '{{objectName}}' from '{{libraryName}}' as a namespace for '{{propertyName}}'. Import '{{propertyName}}' directly: `import { {{propertyName}} } from '{{libraryName}}';`.",
      noDefaultImportForNamespace:
        "Default import '{{importName}}' from '{{libraryName}}' is being used as a namespace. Prefer named imports (e.g.: `import { {{properties}} } from '{{libraryName}}';`).",
      noTypeNamespaceUsage:
        "Do not use type import '{{objectName}}' from '{{libraryName}}' as a namespace for '{{propertyName}}'. Import type '{{propertyName}}' directly: `import type { {{propertyName}} } from '{{libraryName}}';`.",
      noDefaultTypeImportForNamespace:
        "Default type import '{{importName}}' from '{{libraryName}}' is being used as a namespace. Prefer named type imports (e.g.: `import type { {{properties}} } from '{{libraryName}}';`)."
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const allowedLibraries = new Set(options.allowedLibraries || []);
    const targetLibraries = options.targetLibraries || [];
    const shouldCheckAllLibraries = targetLibraries.length === 0;
    const checkTypeScriptTypes = options.checkTypeScriptTypes !== false;
    const allowTypeNamespaces = options.allowTypeNamespaces || false;

    // Check if current file is TypeScript
    const filename = context.getFilename();
    const isTypeScript = /\.(ts|tsx)$/.test(filename);

    // Store information about default imports
    const defaultImports = new Map(); // libraryName -> [import info]

    function shouldCheckLibrary(libraryName) {
      if (allowedLibraries.has(libraryName)) {
        return false;
      }
      return shouldCheckAllLibraries || targetLibraries.includes(libraryName);
    }

    return {
      /**
       * Visitor for ImportDeclaration nodes.
       * Check for default imports from target libraries.
       */
      ImportDeclaration(node) {
        const libraryName = node.source.value;

        if (!shouldCheckLibrary(libraryName)) {
          return;
        }

        const defaultSpecifier = node.specifiers.find(
          (s) => s.type === "ImportDefaultSpecifier"
        );

        if (defaultSpecifier && defaultSpecifier.local) {
          // Check if this is a type-only import in TypeScript
          const isTypeOnlyImport = isTypeScript && 
            checkTypeScriptTypes && 
            node.importKind === "type";
          
          // Skip if type namespaces are allowed and this is a type import
          if (isTypeOnlyImport && allowTypeNamespaces) {
            return;
          }

          if (!defaultImports.has(libraryName)) {
            defaultImports.set(libraryName, []);
          }

          defaultImports.get(libraryName).push({
            node: node,
            localName: defaultSpecifier.local.name,
            libraryName: libraryName,
            isUsedAsNamespace: false,
            namespacedProperties: new Set(),
            isTypeImport: isTypeOnlyImport,
          });
        }
      },

      /**
       * Visitor for MemberExpression nodes.
       * Check for namespace usage like `lodash.map`, `Redux.createStore`, etc.
       */
      MemberExpression(node) {
        if (
          node.object &&
          node.object.type === "Identifier" &&
          node.property &&
          node.property.type === "Identifier"
        ) {
          const objectName = node.object.name;
          const propertyName = node.property.name;

          // Find which library this default import belongs to
          for (const [libraryName, imports] of defaultImports.entries()) {
            const defaultImport = imports.find(
              (imp) => imp.localName === objectName
            );

            if (defaultImport) {
              defaultImport.isUsedAsNamespace = true;
              defaultImport.namespacedProperties.add(propertyName);

              const messageId = defaultImport.isTypeImport ? 
                "noTypeNamespaceUsage" : 
                "noNamespaceUsage";

              context.report({
                node: node,
                messageId: messageId,
                data: {
                  objectName: objectName,
                  propertyName: propertyName,
                  libraryName: libraryName,
                },
                fix(fixer) {
                  return fixer.replaceText(node, propertyName);
                },
              });
              break;
            }
          }
        }
      },

      /**
       * Called after AST traversal is complete.
       * Report on import declarations that are used as namespaces.
       */
      "Program:exit"() {
        for (const [libraryName, imports] of defaultImports.entries()) {
          imports.forEach((imp) => {
            if (imp.isUsedAsNamespace) {
              const propertiesArray = Array.from(imp.namespacedProperties);
              const propertiesString =
                propertiesArray.slice(0, 3).join(", ") +
                (propertiesArray.length > 3 ? ", ..." : "");

              const messageId = imp.isTypeImport ? 
                "noDefaultTypeImportForNamespace" : 
                "noDefaultImportForNamespace";

              context.report({
                node: imp.node,
                messageId: messageId,
                data: {
                  importName: imp.localName,
                  libraryName: libraryName,
                  properties: propertiesString,
                },
                fix(fixer) {
                  // Get existing named import specifiers
                  const existingNamedImportSpecifiers =
                    imp.node.specifiers.filter(
                      (s) => s.type === "ImportSpecifier"
                    );
                  const existingNamedImportNames = new Set(
                    existingNamedImportSpecifiers.map((s) => s.imported.name)
                  );

                  // Combine existing named imports with namespaced properties
                  const allNeededNamedImports = new Set([
                    ...existingNamedImportNames,
                    ...Array.from(imp.namespacedProperties),
                  ]);

                  if (allNeededNamedImports.size === 0) {
                    return fixer.remove(imp.node);
                  }

                  const sortedNamedImports = Array.from(
                    allNeededNamedImports
                  ).sort();
                  const newImportSpecifiersString =
                    sortedNamedImports.join(", ");
                  
                  const importPrefix = imp.isTypeImport ? "import type" : "import";
                  const newImportStatement = `${importPrefix} { ${newImportSpecifiersString} } from '${libraryName}';`;

                  return fixer.replaceText(imp.node, newImportStatement);
                },
              });
            }
          });
        }
      },
    };
  },
};
