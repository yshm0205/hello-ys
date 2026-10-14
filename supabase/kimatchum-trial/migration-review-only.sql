-- REVIEW ONLY: not applied. No public access or automatic mail triggers.
BEGIN;
CREATE SCHEMA kimatchum_trial;
REVOKE ALL ON SCHEMA kimatchum_trial FROM PUBLIC, anon, authenticated;
CREATE TABLE kimatchum_trial.jobs (
    id text PRIMARY KEY CHECK (id ~ '^[a-f0-9]{32}$'),
    idem_hash text UNIQUE NOT NULL, fingerprint text NOT NULL,
    email text NOT NULL CHECK (email = 'hmys0205hmys@gmail.com'),
    title text NOT NULL CHECK (length(title) <= 120),
    owner_id uuid NOT NULL REFERENCES auth.users(id),
    image_bucket text NOT NULL CHECK (image_bucket = 'kimatchum-trial-private'),
    image_path text UNIQUE NOT NULL,
    mime text NOT NULL CHECK (mime IN ('image/png','image/jpeg')),
    draft jsonb NOT NULL, state text NOT NULL CHECK (state IN ('awaiting_email','queued','reviewing','completed')),
    created double precision NOT NULL, expires double precision NOT NULL,
    receipt_hash text NOT NULL, verification_hash text NOT NULL, owner_hash text,
    version integer NOT NULL DEFAULT 0, result jsonb, completion_key text,
    reviewer_id uuid REFERENCES auth.users(id), approved_at timestamptz,
    result_version integer,
    CHECK (state != 'completed' OR (result IS NOT NULL AND reviewer_id IS NOT NULL AND approved_at IS NOT NULL AND result_version IS NOT NULL))
);
CREATE TABLE kimatchum_trial.outbox (
    id text PRIMARY KEY, job_id text NOT NULL REFERENCES kimatchum_trial.jobs(id),
    kind text NOT NULL CHECK (kind IN ('verify','access','review_ready','result')),
    recipient text NOT NULL CHECK (recipient = 'hmys0205hmys@gmail.com'),
    envelope jsonb NOT NULL CHECK (coalesce(envelope->>'recipient', '') = 'hmys0205hmys@gmail.com'),
    state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','sending','accepted','rejected','unknown','blocked')),
    attempts integer NOT NULL DEFAULT 0, started double precision, expires double precision,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    code text NOT NULL, provider_id text, UNIQUE(job_id,kind)
);
CREATE TABLE kimatchum_trial.mail_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mail_id text NOT NULL REFERENCES kimatchum_trial.outbox(id),
    at timestamptz NOT NULL DEFAULT now(), state text NOT NULL, code text NOT NULL
);
ALTER TABLE kimatchum_trial.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kimatchum_trial.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE kimatchum_trial.mail_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA kimatchum_trial FROM PUBLIC, anon, authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('kimatchum-trial-private','kimatchum-trial-private',false,6291456,ARRAY['image/png','image/jpeg']);
CREATE TABLE kimatchum_trial.principals (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL CHECK(email = 'hmys0205hmys@gmail.com')
);
ALTER TABLE kimatchum_trial.principals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON kimatchum_trial.principals FROM PUBLIC, anon, authenticated;
-- Enrollment is performed only by the service-role backend after getUser and ADMIN_EMAILS checks.
CREATE TABLE kimatchum_trial.ai_requests (
    owner_id uuid NOT NULL REFERENCES auth.users(id), at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE kimatchum_trial.ai_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON kimatchum_trial.ai_requests FROM PUBLIC, anon, authenticated;

CREATE FUNCTION kimatchum_trial.queue(p_job text, p_kind text, p_envelope jsonb)
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE j kimatchum_trial.jobs%ROWTYPE;
BEGIN
  SELECT * INTO STRICT j FROM kimatchum_trial.jobs WHERE id=p_job;
  IF j.email != 'hmys0205hmys@gmail.com'
     OR coalesce(p_envelope->>'recipient','') != j.email
     OR jsonb_typeof(p_envelope) != 'object'
     OR p_envelope - ARRAY['recipient','subject','body','message_id'] != '{}'::jsonb
     OR NOT (p_envelope ?& ARRAY['recipient','subject','body','message_id'])
     OR length(p_envelope->>'subject') > 200 OR length(p_envelope->>'body') > 12000
     OR (p_kind='verify' AND j.state!='awaiting_email')
     OR (p_kind IN ('access','review_ready') AND j.state!='queued')
     OR (p_kind='result' AND (j.state!='completed' OR j.approved_at IS NULL OR j.result IS NULL))
  THEN RAISE EXCEPTION 'invalid mail'; END IF;
  INSERT INTO kimatchum_trial.outbox(id,job_id,kind,recipient,envelope,state,code,expires)
    VALUES(p_job||':'||p_kind,p_job,p_kind,j.email,p_envelope,'pending','queued',
           CASE WHEN p_kind='verify' THEN j.expires ELSE NULL END)
    ON CONFLICT(job_id,kind) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION kimatchum_trial.queue(text,text,jsonb) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.km_trial_command(p_action text, p_owner uuid, p_job text DEFAULT '', p_data jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  j kimatchum_trial.jobs%ROWTYPE;
  m kimatchum_trial.outbox%ROWTYPE;
  now_s double precision := extract(epoch FROM clock_timestamp());
BEGIN
  -- Only the service-role backend can invoke this RPC. A freshly server-verified
  -- JWT UUID must be provided by the backend; browser claims are never accepted.
  IF p_action='enroll' THEN
    IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_owner AND email='hmys0205hmys@gmail.com' AND email_confirmed_at IS NOT NULL)
    THEN RETURN jsonb_build_object('error','forbidden'); END IF;
    INSERT INTO kimatchum_trial.principals(user_id,email) VALUES(p_owner,'hmys0205hmys@gmail.com') ON CONFLICT(user_id) DO NOTHING;
    RETURN jsonb_build_object('enrolled',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM kimatchum_trial.principals p JOIN auth.users u ON u.id=p.user_id
      WHERE p.user_id=p_owner AND p.email='hmys0205hmys@gmail.com'
        AND u.email=p.email AND u.email_confirmed_at IS NOT NULL)
  THEN RETURN jsonb_build_object('error','forbidden'); END IF;

  IF p_action='ai_claim' THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_owner::text,0));
    IF (SELECT count(*) FROM kimatchum_trial.ai_requests WHERE owner_id=p_owner AND at>now()-interval '1 hour')>=5
    THEN RETURN jsonb_build_object('error','limit'); END IF;
    INSERT INTO kimatchum_trial.ai_requests(owner_id) VALUES(p_owner);
    RETURN jsonb_build_object('allowed',true);
  ELSIF p_action='preflight' THEN
    IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='kimatchum-trial-private' AND public=false)
    THEN RETURN jsonb_build_object('error','invalid'); END IF;
    RETURN jsonb_build_object('schema_version',1);
  ELSIF p_action='list' THEN
    RETURN jsonb_build_object('jobs',coalesce((SELECT jsonb_agg(x ORDER BY x.created DESC) FROM (
      SELECT id,title,state,version,created FROM kimatchum_trial.jobs WHERE owner_id=p_owner
      ORDER BY created DESC LIMIT 100) x),'[]'::jsonb));
  END IF;

  IF p_action='mail_claim' THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text,0));
    -- Claim is durable before HTTP. A crashed or timed-out sender cannot retry.
    WITH recovered AS (
      UPDATE kimatchum_trial.outbox SET state='unknown',code='stale_sending_unknown'
      WHERE state='sending' AND started < now_s-300 RETURNING id
    ) INSERT INTO kimatchum_trial.mail_events(mail_id,state,code)
      SELECT id,'unknown','stale_sending_unknown' FROM recovered;
    SELECT o.* INTO m FROM kimatchum_trial.outbox o WHERE o.state='pending'
      AND EXISTS(SELECT 1 FROM kimatchum_trial.jobs owned WHERE owned.id=o.job_id AND owned.owner_id=p_owner)
      ORDER BY o.created_at, CASE o.kind WHEN 'verify' THEN 0 WHEN 'access' THEN 1 WHEN 'review_ready' THEN 2 ELSE 3 END, o.id
      FOR UPDATE SKIP LOCKED LIMIT 1;
    IF NOT FOUND THEN RETURN '{}'::jsonb; END IF;
    SELECT * INTO STRICT j FROM kimatchum_trial.jobs WHERE id=m.job_id;
    IF m.recipient!='hmys0205hmys@gmail.com' OR coalesce(m.envelope->>'recipient','')!=m.recipient
       OR (m.kind='result' AND (j.state!='completed' OR j.approved_at IS NULL OR j.result IS NULL))
       OR (m.kind='verify' AND (j.state!='awaiting_email' OR now_s>m.expires))
       OR (m.kind IN ('access','review_ready') AND j.state NOT IN ('queued','reviewing'))
    THEN
      UPDATE kimatchum_trial.outbox SET state='blocked',code='lifecycle_or_recipient_invalid' WHERE id=m.id;
      INSERT INTO kimatchum_trial.mail_events(mail_id,state,code) VALUES(m.id,'blocked','lifecycle_or_recipient_invalid');
      RETURN '{}'::jsonb;
    END IF;
    UPDATE kimatchum_trial.outbox SET state='sending',started=now_s,attempts=attempts+1,code='claimed' WHERE id=m.id;
    INSERT INTO kimatchum_trial.mail_events(mail_id,state,code) VALUES(m.id,'sending','claimed');
    RETURN jsonb_build_object('id',m.id,'recipient',m.recipient,'envelope',m.envelope);
  ELSIF p_action='mail_finish' THEN
    IF p_data->>'state' NOT IN ('accepted','rejected','unknown','blocked')
       OR coalesce(p_data->>'code','') !~ '^[a-z_]{1,80}$'
    THEN RETURN jsonb_build_object('error','invalid'); END IF;
    UPDATE kimatchum_trial.outbox SET state=p_data->>'state',code=p_data->>'code',provider_id=p_data->>'provider_id'
      WHERE id=p_job AND state='sending' RETURNING * INTO m;
    IF NOT FOUND THEN RETURN jsonb_build_object('error','conflict'); END IF;
    INSERT INTO kimatchum_trial.mail_events(mail_id,state,code) VALUES(m.id,m.state,m.code);
    RETURN jsonb_build_object('state',m.state);
  END IF;

  IF p_job !~ '^[a-f0-9]{32}$' THEN RETURN jsonb_build_object('error','invalid'); END IF;
  -- Serialize same-owner intake/idempotency races, including the first insert.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text,0));
  SELECT * INTO j FROM kimatchum_trial.jobs WHERE id=p_job AND owner_id=p_owner FOR UPDATE;
  IF p_action='lookup' THEN
    IF j.id IS NULL THEN RETURN '{}'::jsonb; END IF;
    IF j.fingerprint IS DISTINCT FROM p_data->>'fingerprint' THEN RETURN jsonb_build_object('error','conflict'); END IF;
    RETURN jsonb_build_object('id',j.id,'state',j.state,'duplicate',true);
  ELSIF p_action='submit' THEN
    IF j.id IS NOT NULL THEN
      IF j.fingerprint IS DISTINCT FROM p_data->>'fingerprint' THEN RETURN jsonb_build_object('error','conflict'); END IF;
      RETURN jsonb_build_object('id',j.id,'state',j.state,'duplicate',true);
    END IF;
    IF coalesce(p_data->>'email','')!='hmys0205hmys@gmail.com'
       OR p_data->>'image_path' IS DISTINCT FROM p_owner::text||'/'||p_job
       OR NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='kimatchum-trial-private' AND public=false)
       OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='kimatchum-trial-private' AND name=p_data->>'image_path')
    THEN RETURN jsonb_build_object('error','invalid'); END IF;
    IF (SELECT count(*) FROM kimatchum_trial.jobs WHERE owner_id=p_owner AND created>now_s-3600)>=5
       OR (SELECT count(*) FROM kimatchum_trial.jobs)>=100
    THEN RETURN jsonb_build_object('error','limit'); END IF;
    INSERT INTO kimatchum_trial.jobs(id,idem_hash,fingerprint,email,title,owner_id,image_bucket,image_path,mime,draft,
        state,created,expires,receipt_hash,verification_hash)
      VALUES(p_job,p_data->>'idem_hash',p_data->>'fingerprint',p_data->>'email',p_data->>'title',p_owner,
        'kimatchum-trial-private',p_data->>'image_path',p_data->>'mime',p_data->'draft','awaiting_email',now_s,now_s+1800,'',p_data->>'verification_hash');
    PERFORM kimatchum_trial.queue(p_job,'verify',p_data->'mail');
    RETURN jsonb_build_object('id',p_job,'state','awaiting_email','duplicate',false);
  END IF;
  IF j.id IS NULL THEN RETURN jsonb_build_object('error','not_found'); END IF;
  IF p_action='read' THEN
    RETURN jsonb_build_object('id',j.id,'title',j.title,'state',j.state,'version',j.version,'draft',j.draft,
      'image_path',j.image_path,'mime',j.mime,'result',j.result,'approved_at',j.approved_at,
      'reviewer_id',j.reviewer_id,'result_version',j.result_version,
      'delivery',(SELECT state FROM kimatchum_trial.outbox WHERE job_id=j.id AND kind='result'));
  ELSIF p_action='verify' THEN
    IF j.state!='awaiting_email' OR now_s>j.expires OR j.verification_hash IS DISTINCT FROM p_data->>'verification_hash'
    THEN RETURN jsonb_build_object('error','expired'); END IF;
    UPDATE kimatchum_trial.jobs SET state='queued',verification_hash='',version=version+1 WHERE id=p_job;
    PERFORM kimatchum_trial.queue(p_job,'access',p_data->'access_mail');
    PERFORM kimatchum_trial.queue(p_job,'review_ready',p_data->'review_mail');
    RETURN jsonb_build_object('id',p_job,'state','queued');
  ELSIF p_action='review_claim' THEN
    IF j.state!='queued' THEN RETURN jsonb_build_object('error','conflict'); END IF;
    UPDATE kimatchum_trial.jobs SET state='reviewing',reviewer_id=p_owner,version=version+1 WHERE id=p_job;
    RETURN jsonb_build_object('id',p_job,'state','reviewing','version',j.version+1,'draft',j.draft,'title',j.title);
  ELSIF p_action='complete' THEN
    IF jsonb_typeof(p_data->'version') IS DISTINCT FROM 'number'
       OR coalesce(p_data->>'version','') !~ '^(0|[1-9][0-9]{0,9})$'
    THEN RETURN jsonb_build_object('error','invalid'); END IF;
    IF (p_data->>'version')::numeric > 2147483647
    THEN RETURN jsonb_build_object('error','invalid'); END IF;
    IF j.state='completed' AND j.result=p_data->'result' THEN
      RETURN jsonb_build_object('state','completed','duplicate',true); END IF;
    IF j.state!='reviewing' OR j.reviewer_id IS DISTINCT FROM p_owner OR j.version IS DISTINCT FROM (p_data->>'version')::integer
       OR jsonb_typeof(p_data->'result') IS DISTINCT FROM 'object'
    THEN RETURN jsonb_build_object('error','conflict'); END IF;
    UPDATE kimatchum_trial.jobs SET state='completed',result=p_data->'result',version=version+1,
      approved_at=clock_timestamp(),result_version=version+1 WHERE id=p_job;
    WITH cancelled AS (
      UPDATE kimatchum_trial.outbox SET state='blocked',code='superseded_by_completion'
      WHERE job_id=p_job AND state='pending' AND kind IN ('verify','access','review_ready') RETURNING id
    ) INSERT INTO kimatchum_trial.mail_events(mail_id,state,code)
      SELECT id,'blocked','superseded_by_completion' FROM cancelled;
    PERFORM kimatchum_trial.queue(p_job,'result',p_data->'mail');
    RETURN jsonb_build_object('state','completed','duplicate',false,'delivery','pending');
  END IF;
  RETURN jsonb_build_object('error','invalid');
END $$;
REVOKE ALL ON FUNCTION public.km_trial_command(text,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.km_trial_command(text,uuid,text,jsonb) TO service_role;
-- Only this narrow RPC is exposed. No direct table grants or public storage policies.
COMMIT;
