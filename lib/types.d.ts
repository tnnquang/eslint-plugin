export interface ESLintRule {
  meta: {
    type: 'problem' | 'suggestion' | 'layout';
    docs: {
      description: string;
      category?: string;
      recommended?: boolean;
      url?: string;
    };
    fixable?: 'code' | 'whitespace';
    schema: any[];
    messages: Record<string, string>;
  };
  create: (context: any) => Record<string, any>;
}

export interface NoNamespaceImportOptions {
  allowedLibraries?: string[];
  targetLibraries?: string[];
}

export interface NoArrowComponentsOptions {
  // Currently no options, but reserved for future use
}

export interface EnforcePathAliasOptions {
  mode?: 'all' | 'direct-children';
  configFile?: string;
  paths?: Record<string, string[]>;
  baseUrl?: string;
  fallbackBaseUrl?: string;
  exclude?: string[];
}

export interface PluginConfig {
  plugins: string[];
  rules: Record<string, string | [string, any]>;
}

export interface PluginConfigs {
  recommended: PluginConfig;
  strict: PluginConfig;
  react: PluginConfig;
  vue: PluginConfig;
  angular: PluginConfig;
  nestjs: PluginConfig;
  nextjs: PluginConfig;
  nuxt: PluginConfig;
}

export interface ESLintPlugin {
  rules: {
    'no-arrow-components': ESLintRule;
    'no-namespace-import': ESLintRule;
    'enforce-path-alias': ESLintRule;
  };
  configs: PluginConfigs;
}
