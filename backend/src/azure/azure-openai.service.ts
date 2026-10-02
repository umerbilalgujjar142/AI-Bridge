import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getBearerTokenProvider, type TokenCredential } from '@azure/identity';
import OpenAI from 'openai';
import { AZURE_CREDENTIAL } from './azure.constants.js';

// Entra ID scope for Azure AI / Azure OpenAI data-plane calls.
const COGNITIVE_SERVICES_SCOPE = 'https://cognitiveservices.azure.com/.default';

@Injectable()
export class AzureOpenAiService {
  private readonly logger = new Logger(AzureOpenAiService.name);
  private readonly client: OpenAI;
  private readonly deployment: string;

  constructor(
    @Inject(AZURE_CREDENTIAL) credential: TokenCredential,
    config: ConfigService,
  ) {
    this.deployment = config.getOrThrow<string>('AZURE_OPENAI_DEPLOYMENT');
    this.client = new OpenAI({
      baseURL: config.getOrThrow<string>('AZURE_OPENAI_ENDPOINT'),
      // Keyless: instead of an API key, the SDK asks for a fresh Entra ID token per request.
      apiKey: getBearerTokenProvider(credential, COGNITIVE_SERVICES_SCOPE),
      timeout: 25_000, // stays below the frontend's 30s timeout
      maxRetries: 1,
    });
  }

  async generate(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const response = await this.client.responses.create({
        model: this.deployment, // on Azure, "model" is the DEPLOYMENT name
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        reasoning: { effort: 'low' }, // gpt-5-mini is a reasoning model: keep thinking short
        max_output_tokens: 2000, // cost cap; includes reasoning tokens
      });

      const usage = response.usage;
      this.logger.log(
        `Model call ok (input ${usage?.input_tokens ?? '?'} tokens, output ${usage?.output_tokens ?? '?'} tokens)`,
      );

      if (!response.output_text) {
        throw new BadGatewayException(
          'The AI model returned an empty answer. Please try again.',
        );
      }
      return response.output_text;
    } catch (err) {
      if (!(err instanceof OpenAI.APIError)) throw err;

      // Log the status for debugging, but never the prompt contents or tokens.
      this.logger.error(`Azure OpenAI error ${err.status}: ${err.message}`);
      if (err.status === 429) {
        throw new ServiceUnavailableException(
          'The AI service is busy. Please try again shortly.',
        );
      }
      if (err.status === 401 || err.status === 403) {
        this.logger.error(
          'Check the data-plane role (e.g. Cognitive Services OpenAI User) on the Foundry resource.',
        );
      }
      throw new BadGatewayException('The AI service is unavailable right now.');
    }
  }
}
