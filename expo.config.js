const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add this for better error handling
config.reporter = {
  ...config.reporter,
  update: () => {},
};

// Required for expo-router
config.resolver.assetExts = [...config.resolver.assetExts, 'mjs'];

module.exports = config;