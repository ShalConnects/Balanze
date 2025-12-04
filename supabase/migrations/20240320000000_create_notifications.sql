-- Create notifications table
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    body text,
    type text not null check (type in ('info', 'success', 'warning', 'error')),
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Create policies
create policy "Users can view their own notifications"
    on public.notifications for select
    using (auth.uid() = user_id);

create policy "Users can update their own notifications"
    on public.notifications for update
    using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
    on public.notifications for delete
    using (auth.uid() = user_id);

-- Create index for faster queries
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_created_at_idx on public.notifications(created_at desc); 