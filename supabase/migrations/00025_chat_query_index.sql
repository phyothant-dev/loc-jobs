-- Composite index for chat conversation queries
-- The chat detail screen filters by job_id + (sender_id = X AND receiver_id = Y) OR (sender_id = Y AND receiver_id = X)
-- Single-column indexes can't efficiently narrow down this pattern

create index messages_job_id_sender_receiver_idx on public.messages (job_id, sender_id, receiver_id);

-- Also index reply_to_id for the self-join in the chat query
create index messages_reply_to_id_idx on public.messages (reply_to_id);
