import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  CORS_ORIGIN: Joi.string().uri().default('http://localhost:5178'),

  // Azure (configuration, not secrets: access is controlled by Entra ID + RBAC)
  AZURE_SUBSCRIPTION_ID: Joi.string().guid(),
  AZURE_RESOURCE_GROUP: Joi.string().default('rg-aibridge-dev'),
  KEY_VAULT_URL: Joi.string().uri({ scheme: 'https' }).required(),
  AZURE_OPENAI_ENDPOINT: Joi.string().uri({ scheme: 'https' }).required(),
  AZURE_OPENAI_DEPLOYMENT: Joi.string().required(),
  AZURE_OPENAI_EMBEDDING_DEPLOYMENT: Joi.string().required(),

  // PostgreSQL + pgvector (Phase 9). PG_PASSWORD is the only real secret here;
  // it moves to Key Vault when the app is deployed.
  PG_HOST: Joi.string().hostname().required(),
  PG_PORT: Joi.number().port().default(5432),
  PG_USER: Joi.string().required(),
  // "password" locally, "entra" in Azure (managed identity token, no secret).
  PG_AUTH_MODE: Joi.string().valid('password', 'entra').default('password'),
  PG_PASSWORD: Joi.string().when('PG_AUTH_MODE', {
    is: 'password',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  PG_DB: Joi.string().required(),
  PG_SSL: Joi.boolean().default(true),
});
