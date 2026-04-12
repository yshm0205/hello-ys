-- batch_job_items: 환불/재시도 지원 필드 추가
ALTER TABLE batch_job_items
ADD COLUMN IF NOT EXISTS attempt_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_refunded int DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_processed_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS error_code text NULL;

-- credit_transactions: 환불 추적 필드 추가
ALTER TABLE credit_transactions
ADD COLUMN IF NOT EXISTS reference_id text NULL,
ADD COLUMN IF NOT EXISTS balance_after int NULL,
ADD COLUMN IF NOT EXISTS admin_note text NULL,
ADD COLUMN IF NOT EXISTS metadata jsonb NULL;

-- credit_transactions: reference_id 중복 환불 방지 (type+reference_id 조합)
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_refund_unique
ON credit_transactions (reference_id, type)
WHERE reference_id IS NOT NULL AND type = 'refund';

-- 원자적 환불 함수 (FOR UPDATE + 중복 체크 + 잔액 복구 + 기록)
CREATE OR REPLACE FUNCTION refund_batch_item(
  p_reference_id text,
  p_user_id uuid,
  p_amount int,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_credits int;
  v_new_credits int;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount');
  END IF;

  IF EXISTS (
    SELECT 1 FROM credit_transactions
    WHERE reference_id = p_reference_id AND type = 'refund'
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate');
  END IF;

  SELECT credits INTO v_current_credits
  FROM user_plans
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  v_new_credits := v_current_credits + p_amount;
  UPDATE user_plans SET credits = v_new_credits WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, type, amount, balance_after, description, reference_id, metadata)
  VALUES (
    p_user_id, 'refund', p_amount, v_new_credits,
    'credit refund: ' || p_reason, p_reference_id,
    jsonb_build_object('reason', p_reason, 'original_amount', p_amount)
  );

  RETURN jsonb_build_object('success', true, 'credits', v_new_credits);
END;
$$;
