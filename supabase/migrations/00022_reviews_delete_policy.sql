-- Allow reviewers to delete their own reviews

drop policy if exists "Reviewers can delete their own reviews" on public.reviews;
create policy "Reviewers can delete their own reviews"
  on public.reviews for delete
  using (auth.uid() = reviewer_id);
