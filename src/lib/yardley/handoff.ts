/** One immutable attempt per reviewed snapshot. Resend owns cross-function retry deduplication. */
import { parseGuideSubmission, formatGuideEmail, guideReceiptSchema, type GuideSubmission, type GuideReceipt, type FieldError } from '../../data/lead';

export interface HandoffDraft { contact: unknown; brief: unknown; website?: string }
interface Attempt { submission: GuideSubmission; signature: string; mail: { subject: string; text: string }; startedAt?: number }
export class HandoffError extends Error {
  constructor(message: string, readonly errors: FieldError[] = []) { super(message); }
}
export class YardleyHandoff {
  private draft?: Attempt;
  private attempt?: Attempt;
  private acceptedSignature?: string;
  private pending = false;
  receipt?: Readonly<GuideReceipt>;
  get busy(): boolean { return this.pending; }
  prepare(draft: HandoffDraft): { ok: true; attempt: Attempt; alreadyAccepted: boolean } | { ok: false; errors: FieldError[] } {
    const parsed = parseGuideSubmission({ ...draft, version: 2, source: 'mixer-guide', submissionId: '00000000-0000-4000-8000-000000000000' });
    if (!parsed.ok) return parsed;
    const { submissionId: _unused, ...content } = parsed.submission;
    const signature = JSON.stringify(content);
    let attempt = this.attempt?.signature === signature ? this.attempt : this.draft?.signature === signature ? this.draft : undefined;
    if (!attempt) {
      const submission = { ...parsed.submission, submissionId: crypto.randomUUID() };
      attempt = { submission, signature, mail: formatGuideEmail(submission) };
      this.draft = attempt;
    }
    return { ok: true, attempt, alreadyAccepted: signature === this.acceptedSignature };
  }
  async submit(draft: HandoffDraft, fetcher: typeof fetch = fetch): Promise<Readonly<GuideReceipt> | undefined> {
    if (this.pending) return;
    const prepared = this.prepare(draft);
    if (!prepared.ok) throw new HandoffError('Check your contact details and confirmed job answers.', prepared.errors);
    if (prepared.alreadyAccepted) return this.receipt;
    const attempt = structuredClone(prepared.attempt);
    if (attempt.startedAt && Date.now() - attempt.startedAt >= 23 * 60 * 60 * 1000) throw new HandoffError('This saved send attempt is too old to retry safely. Call Paul before starting another inquiry.');
    attempt.startedAt ??= Date.now(); this.attempt = attempt; this.pending = true;
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 19_000);
    try {
      const response = await fetcher('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attempt.submission), signal: controller.signal });
      const text = await response.text();
      if (text.length > 32_768) throw new Error('invalid-receipt');
      const body = JSON.parse(text) as { ok?: boolean; receipt?: unknown; errors?: FieldError[] };
      if (!response.ok || !body.ok) {
        const errors = Array.isArray(body.errors) ? body.errors.filter((error) => typeof error?.field === 'string' && typeof error?.message === 'string') : [];
        throw new HandoffError(errors[0]?.message ?? 'The request was not accepted. Retry the same brief or call Paul.', errors);
      }
      const receipt = guideReceiptSchema.safeParse(body.receipt);
      if (!receipt.success || receipt.data.submissionId !== attempt.submission.submissionId || receipt.data.text !== attempt.mail.text || receipt.data.subject !== attempt.mail.subject) throw new Error('invalid-receipt');
      this.receipt = Object.freeze({ ...receipt.data }); this.acceptedSignature = attempt.signature;
      return this.receipt;
    } catch (error) {
      if (error instanceof HandoffError) throw error;
      throw new HandoffError('We could not confirm the send. Your brief is still here. Retry the same brief or call Paul.');
    } finally { clearTimeout(timer); this.pending = false; }
  }
}
