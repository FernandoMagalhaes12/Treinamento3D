// craco.config.js
const path = require("path");
require("dotenv").config();

// Check if we're in development/preview mode (not production build)
// Craco sets NODE_ENV=development for start, NODE_ENV=production for build
const isDevServer = process.env.NODE_ENV !== "production";

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
  enableVisualEdits: false, // Disabled - causing issues with R3F
};

// Conditionally load visual edits modules only in dev mode
let setupDevServer;
let babelMetadataPlugin;

if (config.enableVisualEdits) {
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
}

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

const webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {

      const mediapipePattern = /@mediapipe[\\/]tasks-vision/;

      const excludeMediapipeFromSourceMapLoader = (rules) => {
        if (!Array.isArray(rules)) return;

        rules.forEach((rule) => {
          if (rule.oneOf) {
            excludeMediapipeFromSourceMapLoader(rule.oneOf);
          }

          const usesSourceMapLoader =
            (typeof rule.loader === "string" && rule.loader.includes("source-map-loader")) ||
            (Array.isArray(rule.use) && rule.use.some((entry) => {
              if (typeof entry === "string") {
                return entry.includes("source-map-loader");
              }
              return Boolean(entry && entry.loader && String(entry.loader).includes("source-map-loader"));
            }));

          if (!usesSourceMapLoader) return;

          if (!rule.exclude) {
            rule.exclude = mediapipePattern;
            return;
          }

          if (Array.isArray(rule.exclude)) {
            rule.exclude.push(mediapipePattern);
            return;
          }

          rule.exclude = [rule.exclude, mediapipePattern];
        });
      };

      excludeMediapipeFromSourceMapLoader(webpackConfig.module?.rules);

      // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
        ],
      };

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

// Only add babel metadata plugin during dev server
if (config.enableVisualEdits && babelMetadataPlugin) {
  webpackConfig.babel = {
    plugins: [babelMetadataPlugin],
  };
}

webpackConfig.devServer = (devServerConfig) => {
  const devPort = Number(process.env.PORT || 3000);

  devServerConfig.client = {
    ...(devServerConfig.client || {}),
    webSocketURL: {
      protocol: "ws",
      hostname: "localhost",
      port: devPort,
      pathname: "/ws",
    },
  };

  // Apply visual edits dev server setup only if enabled
  if (config.enableVisualEdits && setupDevServer) {
    devServerConfig = setupDevServer(devServerConfig);
  }

  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

module.exports = webpackConfig;
