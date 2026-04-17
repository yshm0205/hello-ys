alter table if exists public.user_plans
  add column if not exists subscription_credits integer not null default 0,
  add column if not exists purchased_credits integer not null default 0;

-- Split the legacy single balance into:
-- - subscription_credits: the current month's expiring subscription bucket
-- - purchased_credits: cumulative top-up credits
--
-- For active paid plans, treat up to one monthly allocation as subscription credits
-- so existing customers do not receive a full permanent rollover during migration.
update public.user_plans
set
  subscription_credits =
    case
      when coalesce(monthly_credit_amount, 0) > 0
        and plan_type <> 'free'
        and (expires_at is null or expires_at >= now())
      then least(coalesce(credits, 0), monthly_credit_amount)
      else 0
    end,
  purchased_credits =
    greatest(
      coalesce(credits, 0) -
        case
          when coalesce(monthly_credit_amount, 0) > 0
            and plan_type <> 'free'
            and (expires_at is null or expires_at >= now())
          then least(coalesce(credits, 0), monthly_credit_amount)
          else 0
        end,
      0
    )
where coalesce(subscription_credits, 0) = 0
  and coalesce(purchased_credits, 0) = 0
  and coalesce(credits, 0) > 0;

update public.user_plans
set credits = coalesce(subscription_credits, 0) + coalesce(purchased_credits, 0);

create or replace function public.refund_batch_item(
  p_reference_id text,
  p_user_id uuid,
  p_amount int,
  p_reason text
) returns jsonb
language plpgsql
as $$
declare
  v_current_subscription int;
  v_current_purchased int;
  v_new_subscription int;
  v_new_purchased int;
  v_new_total int;
  v_usage_metadata jsonb;
  v_subscription_refund int := 0;
  v_purchased_refund int := 0;
begin
  if p_amount <= 0 then
    return jsonb_build_object('success', false, 'reason', 'invalid_amount');
  end if;

  if exists (
    select 1
    from public.credit_transactions
    where reference_id = p_reference_id
      and type = 'refund'
  ) then
    return jsonb_build_object('success', false, 'reason', 'duplicate');
  end if;

  select metadata
  into v_usage_metadata
  from public.credit_transactions
  where user_id = p_user_id
    and reference_id = p_reference_id
    and type = 'usage'
  order by created_at desc
  limit 1;

  if v_usage_metadata is not null then
    v_subscription_refund := greatest(
      0,
      least(
        p_amount,
        coalesce((v_usage_metadata ->> 'subscriptionDeducted')::int, 0)
      )
    );

    v_purchased_refund := greatest(
      0,
      least(
        p_amount - v_subscription_refund,
        coalesce((v_usage_metadata ->> 'purchasedDeducted')::int, 0)
      )
    );
  end if;

  if v_subscription_refund + v_purchased_refund < p_amount then
    v_purchased_refund := v_purchased_refund + (p_amount - v_subscription_refund - v_purchased_refund);
  end if;

  select
    coalesce(subscription_credits, 0),
    coalesce(purchased_credits, 0)
  into
    v_current_subscription,
    v_current_purchased
  from public.user_plans
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'reason', 'user_not_found');
  end if;

  v_new_subscription := v_current_subscription + v_subscription_refund;
  v_new_purchased := v_current_purchased + v_purchased_refund;
  v_new_total := v_new_subscription + v_new_purchased;

  update public.user_plans
  set
    subscription_credits = v_new_subscription,
    purchased_credits = v_new_purchased,
    credits = v_new_total
  where user_id = p_user_id;

  insert into public.credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    description,
    reference_id,
    metadata
  )
  values (
    p_user_id,
    'refund',
    p_amount,
    v_new_total,
    'credit refund: ' || p_reason,
    p_reference_id,
    jsonb_build_object(
      'reason', p_reason,
      'originalAmount', p_amount,
      'subscriptionRefunded', v_subscription_refund,
      'purchasedRefunded', v_purchased_refund
    )
  );

  return jsonb_build_object('success', true, 'credits', v_new_total);
end;
$$;
