-- Create savings_goals table
create table if not exists savings_goals (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  target_amount decimal not null,
  source_account_id uuid references accounts(id) not null,
  savings_account_id uuid references accounts(id) not null,
  created_at timestamp with time zone default now(),
  description text,
  current_amount decimal default 0
);

-- Add RLS policies
alter table savings_goals enable row level security;

create policy "Users can view their own savings goals"
  on savings_goals for select
  using (
    auth.uid() = (
      select user_id from accounts where id = savings_goals.source_account_id
    )
  );

create policy "Users can insert their own savings goals"
  on savings_goals for insert
  with check (
    auth.uid() = (
      select user_id from accounts where id = source_account_id
    )
  );

create policy "Users can update their own savings goals"
  on savings_goals for update
  using (
    auth.uid() = (
      select user_id from accounts where id = source_account_id
    )
  );

create policy "Users can delete their own savings goals"
  on savings_goals for delete
  using (
    auth.uid() = (
      select user_id from accounts where id = source_account_id
    )
  ); 