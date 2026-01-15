import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Visitor: a
    .model({
      date: a.string().required(),
      ipAddress: a.string().required(),
      timestamp: a.string().required(),
    })
    .identifier(["date", "ipAddress"])
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
