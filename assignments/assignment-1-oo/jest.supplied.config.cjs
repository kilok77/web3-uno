module.exports = {
  clearMocks: true,
  rootDir: __dirname,
  roots: ["<rootDir>/../../reference/tests/oo-model"],
  testEnvironment: "node",
  testMatch: ["**/__test__/model/*.test.ts"],
  moduleNameMapper: {
    "^\\.\\./utils/test_adapter$": "<rootDir>/__test__/utils/test_adapter.ts",
    "^\\./test_adapter$": "<rootDir>/__test__/utils/test_adapter.ts",
    "^\\.\\./\\.\\./src/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },
}
