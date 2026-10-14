// Server-side core. No public route, scheduler, credential loading, or network on import.
const recipient = 'hmys0205hmys@gmail.com';

export async function dispatchOne({ getUser, rpc, apiKey, fromEmail, sendHttp }) {
  const user = await getUser();
  if (!user?.id || user.email !== recipient || !user.email_confirmed_at) {
    return { state: 'blocked', code: 'reviewer_auth_required' };
  }
  if (!apiKey || !fromEmail || /[\r\n,;]/.test(fromEmail)) {
    return { state: 'blocked', code: 'existing_resend_config_required' };
  }
  let claim;
  try {
    claim = await rpc('mail_claim', user.id, '', {});
  } catch {
    return { state: 'unknown', code: 'claim_outcome_unknown' };
  }
  if (claim?.error) return { state: 'blocked', code: 'claim_not_authorized' };
  if (!claim?.id) return { state: 'idle' };
  const envelope = claim.envelope;
  const keys = ['recipient', 'subject', 'body', 'message_id'];
  const valid = claim.recipient === recipient && envelope?.recipient === recipient
    && Object.keys(envelope).length === keys.length && keys.every(key => typeof envelope[key] === 'string')
    && envelope.subject.length > 0 && envelope.subject.length <= 200 && !/[\r\n]/.test(envelope.subject)
    && envelope.body.length <= 12000 && /^<km-[a-f0-9]{64}@kimatchum\.invalid>$/.test(envelope.message_id);
  let outcome = { state: 'blocked', code: 'invalid_envelope' };
  if (valid) {
    try {
      const response = await sendHttp('https://api.resend.com/emails', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30_000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
          'Idempotency-Key': `kimatchum/${envelope.message_id.slice(4, 68)}` },
        body: JSON.stringify({ from: fromEmail, to: [recipient], subject: envelope.subject, text: envelope.body }),
      });
      if (response.ok) {
        const body = await response.json();
        outcome = typeof body.id === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(body.id)
          ? { state: 'accepted', code: 'provider_accepted', provider_id: body.id }
          : { state: 'unknown', code: 'malformed_success_response' };
      } else {
        outcome = [400, 401, 403, 404, 422].includes(response.status)
          ? { state: 'rejected', code: 'provider_rejected' }
          : { state: 'unknown', code: 'provider_outcome_unknown' };
      }
    } catch {
      outcome = { state: 'unknown', code: 'send_outcome_unknown' };
    }
  }
  try {
    const result = await rpc('mail_finish', user.id, claim.id, outcome);
    if (result?.error) return { state: 'unknown', code: 'delivery_record_outcome_unknown' };
  } catch {
    return { state: 'unknown', code: 'delivery_record_outcome_unknown' };
  }
  return outcome;
}
