import { defineFunction } from "@aws-amplify/backend";

export const recordVisit = defineFunction({
  name: "recordVisit",
  entry: "./handler.ts",
});
