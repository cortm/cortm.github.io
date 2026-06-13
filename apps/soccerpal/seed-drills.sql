-- Run once in Supabase SQL Editor: restores all drills + video links

drop policy if exists "Anyone can update drills" on public.drills;
create policy "Anyone can update drills"
  on public.drills for update
  using (true)
  with check (true);

drop policy if exists "Anyone can insert drills" on public.drills;
create policy "Anyone can insert drills"
  on public.drills for insert
  with check (true);

insert into public.drills (id, name, category, type, duration, reps, equipment, xp, description, video_url)
values
  ('toe-taps', 'Toe Taps', 'footwork', 'timer', 60, null, '{}', 15, 'Stand over the ball and tap the top with alternating feet as fast as possible. Keep knees slightly bent, stay light on your toes, and maintain rhythm. Great for touch and coordination.', 'https://www.youtube.com/embed/RKTHpGjhTJ8'),
  ('sole-rolls', 'Sole Rolls', 'ball-control', 'timer', 45, null, '{"ball"}', 20, 'Roll the ball across your body with the sole of one foot, then pull it back with the other. Keep the ball close and use small, controlled touches.', 'https://www.youtube.com/embed/PuF_gM2S7rk'),
  ('ladder-in-out', 'Ladder In-Out', 'agility', 'reps', null, 20, '{"ladder"}', 25, 'Step in and out of each ladder rung with quick feet. Lead with one foot in, then bring the other in, then step out. Alternate lead foot each rep.', 'https://www.youtube.com/embed/4raezhMZ38o'),
  ('cone-weave', 'Cone Weave', 'agility', 'reps', null, 10, '{"cones","ball"}', 30, 'Dribble through cones placed 2 yards apart using the outside of your foot. Cut sharply at each cone and keep your head up between touches.', 'https://www.youtube.com/embed/z7jP3moQi9c'),
  ('box-jumps', 'Quick Feet Box', 'footwork', 'timer', 30, null, '{}', 15, 'Imagine a small box on the ground. Step in with both feet, then out to each side: front, back, left, right. Stay on the balls of your feet throughout.', 'https://www.youtube.com/embed/PuF_gM2S7rk'),
  ('inside-outside', 'Inside-Outside Touches', 'ball-control', 'timer', 60, null, '{"ball"}', 20, 'Alternate inside and outside of the same foot to move the ball side to side. Switch feet every 15 seconds. Keep touches small and controlled.', 'https://www.youtube.com/embed/PuF_gM2S7rk'),
  ('scissors', 'Scissors', 'footwork', 'reps', null, 30, '{}', 15, 'Circle one foot around the front of the standing leg, then switch. Mimic the scissors move without a ball first, then add a stationary ball between your feet.', 'https://www.youtube.com/embed/PuF_gM2S7rk'),
  ('lateral-hops', 'Lateral Hops', 'agility', 'timer', 45, null, '{"cones"}', 20, 'Place two cones 2 feet apart. Hop side to side over an imaginary line between them, landing softly on both feet. Drive with your arms for balance.', 'https://www.youtube.com/embed/4raezhMZ38o'),
  ('pull-push', 'Pull-Push Dribble', 'ball-control', 'reps', null, 40, '{"ball"}', 25, 'Pull the ball back with the sole, then push it forward with the inside of the same foot. Alternate feet. Keep the ball within arm''s reach at all times.', 'https://www.youtube.com/embed/PuF_gM2S7rk'),
  ('tic-tac-toe', 'Tic-Tac-Toe', 'footwork', 'timer', 45, null, '{"ball"}', 20, 'Tap the ball between your feet using the inside of each foot. The ball should travel in a V-shape. Increase speed as you find your rhythm.', 'https://www.youtube.com/embed/RKTHpGjhTJ8'),
  ('figure-eight', 'Figure Eight', 'ball-control', 'reps', null, 15, '{"cones","ball"}', 30, 'Set two cones 3 yards apart. Dribble around them in a figure-eight pattern using both feet. Cut tight around each cone.', 'https://www.youtube.com/embed/z7jP3moQi9c'),
  ('high-knees', 'High Knees Sprint', 'agility', 'timer', 30, null, '{}', 15, 'Drive knees up to hip height while moving forward or in place. Pump arms vigorously. Focus on quick ground contact.', 'https://www.youtube.com/embed/4raezhMZ38o'),
  ('shuffle-steps', 'Shuffle Steps', 'footwork', 'timer', 40, null, '{"cones"}', 20, 'Set cones 5 yards apart. Shuffle laterally between them, touching each cone. Stay low in an athletic stance with quick, short steps.', 'https://www.youtube.com/embed/4raezhMZ38o'),
  ('roll-cut', 'Roll & Cut', 'ball-control', 'reps', null, 25, '{"ball"}', 25, 'Roll the ball with your sole, then take a sharp cut with the outside of the same foot. Alternate directions left and right each rep.', 'https://www.youtube.com/embed/PuF_gM2S7rk'),
  ('ladder-icky-shuffle', 'Icky Shuffle', 'agility', 'reps', null, 16, '{"ladder"}', 25, 'Classic ladder drill: in-in-out through each rung. One foot leads in, the other follows, then step out to the side. Stay on your toes.', 'https://www.youtube.com/embed/vkzdBVDMaE0'),
  ('bell-taps', 'Bell Taps', 'footwork', 'timer', 50, null, '{"ball"}', 20, 'Tap the ball back and forth between your feet in a bell-shaped arc. Use the inside of each foot and keep your body centered over the ball.', 'https://www.youtube.com/embed/PuF_gM2S7rk'),
  ('zigzag-dribble', 'Zigzag Dribble', 'ball-control', 'reps', null, 12, '{"cones","ball"}', 30, 'Set 5 cones in a zigzag 2 yards apart. Dribble through using one foot only, then return using the other foot.', 'https://www.youtube.com/embed/z7jP3moQi9c'),
  ('single-leg-hop', 'Single-Leg Hops', 'agility', 'reps', null, 20, '{}', 20, 'Hop forward on one leg for 10 reps, then switch. Land softly with a slight knee bend. Use arms for balance and control.', 'https://www.youtube.com/embed/4raezhMZ38o'),
  ('v-pulls', 'V-Pulls', 'footwork', 'reps', null, 35, '{"ball"}', 20, 'Pull the ball diagonally back with the sole, forming a V shape, then push forward with the inside. Alternate feet each rep.', 'https://www.youtube.com/embed/PuF_gM2S7rk'),
  ('ladder-lateral', 'Lateral Quick Steps', 'agility', 'timer', 40, null, '{"ladder"}', 25, 'Face sideways to the ladder and step both feet into each rung, then out. Move down the ladder quickly without crossing your feet.', 'https://www.youtube.com/embed/4raezhMZ38o'),
  ('cruyff-turn', 'Cruyff Turn Practice', 'ball-control', 'reps', null, 20, '{"ball","cones"}', 35, 'Dribble toward a cone, fake a pass, then drag the ball behind your standing leg with the inside of your foot and turn away.', 'https://www.youtube.com/embed/2Umwwo0YSg4'),
  ('jump-rope-mimic', 'Jump Rope Mimic', 'footwork', 'timer', 60, null, '{}', 15, 'Mimic jump rope without a rope. Small hops on the balls of your feet, wrists rotating at your sides. Build cardio and foot speed.', 'https://www.youtube.com/embed/PuF_gM2S7rk'),
  ('cone-sprint', 'Cone Sprint & Backpedal', 'agility', 'reps', null, 8, '{"cones"}', 25, 'Sprint to a cone 10 yards away, touch it, then backpedal to start. Stay on the balls of your feet during the backpedal.', 'https://www.youtube.com/embed/4raezhMZ38o'),
  ('drag-back', 'Drag Backs', 'ball-control', 'timer', 45, null, '{"ball"}', 20, 'Roll the ball back with the sole of one foot while stepping past it, then switch feet. Keep your body between the ball and an imaginary defender.', 'https://www.youtube.com/embed/PuF_gM2S7rk')
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  type = excluded.type,
  duration = excluded.duration,
  reps = excluded.reps,
  equipment = excluded.equipment,
  xp = excluded.xp,
  description = excluded.description,
  video_url = excluded.video_url,
  updated_at = now();
