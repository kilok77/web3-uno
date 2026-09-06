module.exports = {
  clearMocks: true,
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },
}
