-- Replaces the boolean weeks.show_explanation with a 3-way choice, so a
-- teacher can decide whether explanations show right after each question
-- ("immediate", the old show_explanation=true behavior), only once results
-- are submitted ("end"), or not at all ("off", the old show_explanation=false).
alter table public.weeks
  add column explanation_mode text not null default 'immediate'
  check (explanation_mode in ('off', 'immediate', 'end'));

update public.weeks
  set explanation_mode = case when show_explanation then 'immediate' else 'off' end;

alter table public.weeks drop column show_explanation;
