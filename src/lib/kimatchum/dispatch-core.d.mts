export interface DispatchOutcome {
  state: 'blocked' | 'unknown' | 'idle' | 'accepted' | 'rejected';
  code?: string;
  provider_id?: string;
}
export interface DispatchDependencies {
  getUser(): Promise<{ id: string; email?: string; email_confirmed_at?: string } | null>;
  rpc(action: string, owner: string, job: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
  apiKey: string | undefined;
  fromEmail: string | undefined;
  sendHttp: typeof fetch;
}
export function dispatchOne(dependencies: DispatchDependencies): Promise<DispatchOutcome>;
