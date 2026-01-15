import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Visit: a
    .model({
      id: a.id().required(),
      ipAddress: a.string().required(),
      date: a.string().required(),
      timestamp: a.string().required(),
      createdAt: a.string().required(),
    })
    .authorization((allow) => allow.publicApiKey()),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
