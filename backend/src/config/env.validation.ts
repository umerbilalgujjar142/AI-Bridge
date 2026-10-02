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
});
