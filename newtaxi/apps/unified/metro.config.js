const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Node.js compatibility - avoid using toReversed() on EAS Build servers
// by explicitly setting up the config without relying on newer array methods
config.resolver = {
  ...config.resolver,
  sourceExts: process.env.RN_SRC_EXT
    ? process.env.RN_SRC_EXT.split(',').concat(config.resolver.sourceExts || [])
    : config.resolver.sourceExts,
};

module.exports = config;
