module.exports = {
  clearMocks: true,
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/test/**/*.test.ts",
    "<rootDir>/__test__/**/*.test.ts",
  ],
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },
}
