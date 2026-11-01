/** Browser-only transport: one call per submitted message, bounded turns, abort and stale-result checks. */
import { conversationResponseSchema, type ConversationInput, type ConversationResponse } from '../../data/yardley-conversation';

export class ConversationTransport {
  private controller?: AbortController;
  private revision = 0;
  private turns = 0;
  get busy(): boolean { return !!this.controller; }
  get exhausted(): boolean { return this.turns >= 24; }

  cancel(): void {
    this.revision++;
    this.controller?.abort();
    this.controller = undefined;
  }
  async send(input: ConversationInput, fetcher: typeof fetch = fetch): Promise<ConversationResponse | undefined> {
    if (this.busy) return;
    if (this.exhausted) throw new Error('session-limit');
    const controller = new AbortController();
    const revision = ++this.revision;
    this.controller = controller;
    this.turns++;
    const timer = setTimeout(() => controller.abort(), 19_000);
    try {
      const response = await fetcher('/api/guide', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input), signal: controller.signal,
      });
      if (!response.ok) throw new Error(response.status === 429 ? 'rate-limit' : 'network');
      const text = await response.text();
      if (text.length > 32_768) throw new Error('invalid-response');
      const parsed = conversationResponseSchema.safeParse(JSON.parse(text));
      if (!parsed.success || parsed.data.requestId !== input.requestId) throw new Error('invalid-response');
      if (revision !== this.revision || controller.signal.aborted) return;
      return parsed.data;
    } catch (error) {
      if (revision !== this.revision) return;
      throw error;
    } finally {
      clearTimeout(timer);
      if (revision === this.revision) this.controller = undefined;
    }
  }
}
