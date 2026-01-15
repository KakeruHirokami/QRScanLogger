import { defineFunction } from "@aws-amplify/backend";

export const visitorHandler = defineFunction({
  name: "visitor-handler",
  entry: "./handler.ts",
});
