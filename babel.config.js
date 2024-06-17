module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', '@babel/preset-typescript',],
    plugins: [
      ["module-resolver", {
        "alias": {
          "@app": "./app",
          "@db": "./app/db",
          "@components": "./app/components",
          "@mocks": "./__mocks__",
          "@tests": "./app/__tests__",
        }
      }],
      ["inline-import", { "extensions": [".sql"] }]
    ]
  };
};
