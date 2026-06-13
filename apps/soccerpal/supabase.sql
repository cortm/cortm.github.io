-- Run once in Supabase SQL Editor if the table does not exist yet.

create table if not exists public.drills (
  id text primary key,
  name text not null,
  category text not null
    check (category in ('footwork', 'ball-control', 'agility')),
  type text not null
    check (type in ('timer', 'reps')),
  duration int,
  reps int,
  equipment text[] not null default '{}',
  xp int not null default 15,
  description text not null,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drills_timer_or_reps check (
    (type = 'timer' and duration is not null and reps is null) or
    (type = 'reps' and reps is not null and duration is null)
  )
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists drills_updated_at on public.drills;
create trigger drills_updated_at
  before update on public.drills
  for each row execute function public.set_updated_at();

alter table public.drills enable row level security;

drop policy if exists "Drills are publicly readable" on public.drills;
create policy "Drills are publicly readable"
  on public.drills for select
  using (true);

drop policy if exists "Anyone can update drills" on public.drills;
create policy "Anyone can update drills"
  on public.drills for update
  using (true);

drop policy if exists "Anyone can insert drills" on public.drills;
create policy "Anyone can insert drills"
  on public.drills for insert
  with check (true);

-- Seed (safe to re-run: skips existing ids)
insert into public.drills (id, name, category, type, duration, reps, equipment, xp, description, video_url)
values
  ('toe-taps', 'Toe Taps', 'footwork', 'timer', 60, null, '{}', 15, 'Stand over the ball and tap the top with alternating feet as fast as possible. Keep knees slightly bent, stay light on your toes, and maintain rhythm. Great for touch and coordination.', null),
  ('sole-rolls', 'Sole Rolls', 'ball-control', 'timer', 45, null, '{"ball"}', 20, 'Roll the ball across your body with the sole of one foot, then pull it back with the other. Keep the ball close and use small, controlled touches.', null),
  ('ladder-in-out', 'Ladder In-Out', 'agility', 'reps', null, 20, '{"ladder"}', 25, 'Step in and out of each ladder rung with quick feet. Lead with one foot in, then bring the other in, then step out. Alternate lead foot each rep.', null),
  ('cone-weave', 'Cone Weave', 'agility', 'reps', null, 10, '{"cones","ball"}', 30, 'Dribble through cones placed 2 yards apart using the outside of your foot. Cut sharply at each cone and keep your head up between touches.', null),
  ('box-jumps', 'Quick Feet Box', 'footwork', 'timer', 30, null, '{}', 15, 'Imagine a small box on the ground. Step in with both feet, then out to each side: front, back, left, right. Stay on the balls of your feet throughout.', null),
  ('inside-outside', 'Inside-Outside Touches', 'ball-control', 'timer', 60, null, '{"ball"}', 20, 'Alternate inside and outside of the same foot to move the ball side to side. Switch feet every 15 seconds. Keep touches small and controlled.', null),
  ('scissors', 'Scissors', 'footwork', 'reps', null, 30, '{}', 15, 'Circle one foot around the front of the standing leg, then switch. Mimic the scissors move without a ball first, then add a stationary ball between your feet.', null),
  ('lateral-hops', 'Lateral Hops', 'agility', 'timer', 45, null, '{"cones"}', 20, 'Place two cones 2 feet apart. Hop side to side over an imaginary line between them, landing softly on both feet. Drive with your arms for balance.', null),
  ('pull-push', 'Pull-Push Dribble', 'ball-control', 'reps', null, 40, '{"ball"}', 25, 'Pull the ball back with the sole, then push it forward with the inside of the same foot. Alternate feet. Keep the ball within arm''s reach at all times.', null),
  ('tic-tac-toe', 'Tic-Tac-Toe', 'footwork', 'timer', 45, null, '{"ball"}', 20, 'Tap the ball between your feet using the inside of each foot. The ball should travel in a V-shape. Increase speed as you find your rhythm.', null),
  ('figure-eight', 'Figure Eight', 'ball-control', 'reps', null, 15, '{"cones","ball"}', 30, 'Set two cones 3 yards apart. Dribble around them in a figure-eight pattern using both feet. Cut tight around each cone.', null),
  ('high-knees', 'High Knees Sprint', 'agility', 'timer', 30, null, '{}', 15, 'Drive knees up to hip height while moving forward or in place. Pump arms vigorously. Focus on quick ground contact.', null),
  ('shuffle-steps', 'Shuffle Steps', 'footwork', 'timer', 40, null, '{"cones"}', 20, 'Set cones 5 yards apart. Shuffle laterally between them, touching each cone. Stay low in an athletic stance with quick, short steps.', null),
  ('roll-cut', 'Roll & Cut', 'ball-control', 'reps', null, 25, '{"ball"}', 25, 'Roll the ball with your sole, then take a sharp cut with the outside of the same foot. Alternate directions left and right each rep.', null),
  ('ladder-icky-shuffle', 'Icky Shuffle', 'agility', 'reps', null, 16, '{"ladder"}', 25, 'Classic ladder drill: in-in-out through each rung. One foot leads in, the other follows, then step out to the side. Stay on your toes.', null),
  ('bell-taps', 'Bell Taps', 'footwork', 'timer', 50, null, '{"ball"}', 20, 'Tap the ball back and forth between your feet in a bell-shaped arc. Use the inside of each foot and keep your body centered over the ball.', null),
  ('zigzag-dribble', 'Zigzag Dribble', 'ball-control', 'reps', null, 12, '{"cones","ball"}', 30, 'Set 5 cones in a zigzag 2 yards apart. Dribble through using one foot only, then return using the other foot.', null),
  ('single-leg-hop', 'Single-Leg Hops', 'agility', 'reps', null, 20, '{}', 20, 'Hop forward on one leg for 10 reps, then switch. Land softly with a slight knee bend. Use arms for balance and control.', null),
  ('v-pulls', 'V-Pulls', 'footwork', 'reps', null, 35, '{"ball"}', 20, 'Pull the ball diagonally back with the sole, forming a V shape, then push forward with the inside. Alternate feet each rep.', null),
  ('ladder-lateral', 'Lateral Quick Steps', 'agility', 'timer', 40, null, '{"ladder"}', 25, 'Face sideways to the ladder and step both feet into each rung, then out. Move down the ladder quickly without crossing your feet.', null),
  ('cruyff-turn', 'Cruyff Turn Practice', 'ball-control', 'reps', null, 20, '{"ball","cones"}', 35, 'Dribble toward a cone, fake a pass, then drag the ball behind your standing leg with the inside of your foot and turn away.', null),
  ('jump-rope-mimic', 'Jump Rope Mimic', 'footwork', 'timer', 60, null, '{}', 15, 'Mimic jump rope without a rope. Small hops on the balls of your feet, wrists rotating at your sides. Build cardio and foot speed.', null),
  ('cone-sprint', 'Cone Sprint & Backpedal', 'agility', 'reps', null, 8, '{"cones"}', 25, 'Sprint to a cone 10 yards away, touch it, then backpedal to start. Stay on the balls of your feet during the backpedal.', null),
  ('drag-back', 'Drag Backs', 'ball-control', 'timer', 45, null, '{"ball"}', 20, 'Roll the ball back with the sole of one foot while stepping past it, then switch feet. Keep your body between the ball and an imaginary defender.', null)
on conflict (id) do nothing;
