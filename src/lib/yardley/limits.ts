/** Server policy. Account/key budget + platform rate rule are required before enabling calls. */
export const CONVERSATION_LIMITS = {
  bodyBytes: 32_768,
  contextCharacters: 12_000,
  outputTokens: 1400,
  timeoutMs: 15_000,
  browserTurns: 24,
} as const;
export const APPROVED_MODEL = 'openai/gpt-6-luna';

export interface ConversationConfig {
  enabled: boolean;
  key: string;
  model: string;
  budgetKeyId: string;
  rateLimitId: string;
}
export function conversationConfig(env: Record<string, string | undefined>): ConversationConfig {
  return {
    enabled: env.YARDLEY_AI_ENABLED === 'true', key: env.AI_GATEWAY_API_KEY?.trim() ?? '',
    model: env.AI_GATEWAY_MODEL?.trim() ?? APPROVED_MODEL,
    budgetKeyId: env.YARDLEY_BUDGET_KEY_ID?.trim() ?? '', rateLimitId: env.YARDLEY_RATE_LIMIT_ID?.trim() ?? '',
  };
}
export function configured(config: ConversationConfig): boolean {
  // No automatic OIDC or alternate-model path may bypass the dedicated key budget.
  return config.enabled && !!config.key && config.model === APPROVED_MODEL && !!config.budgetKeyId && !!config.rateLimitId;
}

export function failureReason(error: unknown): 'budget' | 'rate-limit' | 'timeout' | 'provider' {
  let candidate: unknown = error;
  for (let depth = 0; depth < 4 && candidate && typeof candidate === 'object'; depth++) {
    const e = candidate as { statusCode?: number; status?: number; name?: string; code?: string; cause?: unknown };
    if (e.statusCode === 402 || e.status === 402 || e.code === 'quota_for_entity_exceeded' || e.code === 'insufficient_funds') return 'budget';
    if (e.statusCode === 429 || e.status === 429) return 'rate-limit';
    if (e.name === 'TimeoutError') return 'timeout';
    candidate = e.cause;
  }
  return 'provider';
}
