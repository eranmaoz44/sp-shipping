export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.api.test.ts"],
  setupFiles: ["dotenv/config"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
