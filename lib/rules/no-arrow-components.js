module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce function declarations for top-level functions and components",
      category: "Stylistic Issues",
      recommended: false,
      url: "https://github.com/tnnquang/eslint-plugin#no-arrow-components",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowArrowFunctions: {
            type: "boolean",
            default: false,
            description: "Allow arrow functions for non-component functions"
          },
          checkTypeScript: {
            type: "boolean", 
            default: true,
            description: "Apply rules to TypeScript files"
          }
        },
        additionalProperties: false,
      },
    ],
    messages: {
      arrowComponent:
        'React component "{{name}}" must be a function declaration unless wrapped in a HOC like memo() or forwardRef().',
      arrowFunction:
        'Top-level function "{{name}}" must be a function declaration.',
      tsArrowComponent:
        'TypeScript React component "{{name}}" must be a function declaration with proper typing.',
      tsArrowFunction:
        'TypeScript function "{{name}}" must be a function declaration with proper typing.',
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const allowArrowFunctions = options.allowArrowFunctions || false;
    const checkTypeScript = options.checkTypeScript !== false;
    
    // Check if current file is TypeScript
    const filename = context.getFilename();
    const isTypeScript = /\.(ts|tsx)$/.test(filename);
    
    function isPascalCase(name) {
      return /^[A-Z][a-zA-Z0-9]*$/.test(name);
    }

    function isReactComponent(node, name) {
      // Check if it's PascalCase (component naming convention)
      if (!isPascalCase(name)) return false;
      
      // For TypeScript, check for JSX return type or React component patterns
      if (isTypeScript && checkTypeScript) {
        // Check if function returns JSX
        if (node.init && node.init.type === "ArrowFunctionExpression") {
          const body = node.init.body;
          if (body && body.type === "JSXElement") return true;
          if (body && body.type === "BlockStatement") {
            // Check for return statements with JSX
            return body.body.some(stmt => 
              stmt.type === "ReturnStatement" && 
              stmt.argument && 
              stmt.argument.type === "JSXElement"
            );
          }
        }
      }
      
      return isPascalCase(name);
    }

    return {
      VariableDeclaration(node) {
        // Only consider top-level declarations
        if (
          node.parent.type !== "Program" &&
          node.parent.type !== "ExportNamedDeclaration"
        ) {
          return;
        }

        for (const decl of node.declarations) {
          if (
            decl.type !== "VariableDeclarator" ||
            decl.id.type !== "Identifier" ||
            !decl.init
          ) {
            continue;
          }

          const name = decl.id.name;
          const init = decl.init;

          const isComponent = isReactComponent(decl, name);

          // Allow HOC like: const Comp = memo(() => {})
          if (
            isComponent &&
            init.type === "CallExpression" &&
            init.arguments.length > 0 &&
            (init.arguments[0].type === "ArrowFunctionExpression" ||
              init.arguments[0].type === "FunctionExpression")
          ) {
            return;
          }

          // Disallow top-level component arrow functions
          if (
            isComponent &&
            (init.type === "ArrowFunctionExpression" ||
              init.type === "FunctionExpression")
          ) {
            context.report({
              node: decl,
              messageId: isTypeScript && checkTypeScript ? "tsArrowComponent" : "arrowComponent",
              data: { name },
            });
            return;
          }

          // Disallow top-level utility arrow functions (unless allowed)
          if (
            !isComponent &&
            !allowArrowFunctions &&
            (init.type === "ArrowFunctionExpression" ||
              init.type === "FunctionExpression")
          ) {
            context.report({
              node: decl,
              messageId: isTypeScript && checkTypeScript ? "tsArrowFunction" : "arrowFunction",
              data: { name },
            });
          }
        }
      },
    };
  },
};
