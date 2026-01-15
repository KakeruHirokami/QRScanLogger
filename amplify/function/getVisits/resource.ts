import { defineFunction } from "@aws-amplify/backend";

export const getVisits = defineFunction({
  name: "getVisits",
  entry: "./handler.ts",
});
