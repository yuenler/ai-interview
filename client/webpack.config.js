const path = require('path');

module.exports = {
  // ... other configurations ...
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    fallback: {
      "buffer": require.resolve("buffer/"),
      "url": require.resolve("url/"),
      "stream": require.resolve("stream-browserify"),
      // Add other fallbacks as needed
    }
  },
  // ... other configurations ...
};
