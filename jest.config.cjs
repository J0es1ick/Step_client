module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: { jsx: "react-jsx", module: "commonjs" } },
    ],
  },
  moduleNameMapper: { "\\.(css|svg|png)$": "<rootDir>/scripts/test-asset.cjs" },
  clearMocks: true,
};
