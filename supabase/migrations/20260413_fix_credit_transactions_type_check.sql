-- Existing environments can have an outdated type check that rejects "charge".
ALTER TABLE public.credit_transactions
DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

ALTER TABLE public.credit_transactions
ADD CONSTRAINT credit_transactions_type_check
CHECK (type IN ('charge', 'usage', 'refund', 'manual_add', 'manual_deduct'));
