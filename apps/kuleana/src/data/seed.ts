import type { AppState, FamilyMember, Gig } from '../types';

const DEFAULT_FAMILY: FamilyMember[] = [
  { id: '1', name: 'Kid 1' },
  { id: '2', name: 'Kid 2' },
];

const KULEANA_ITEMS = [
  'When the trash is full and you go to put something in it, take it out.',
  'When dishes are in the sink and you go to put them in, check the dishwasher. When the dishwasher is clean, empty it. When the dishwasher is dirty, load your dish.',
  'When some of your belongings are sitting out being unused and you walk by them, put them away.',
  'When a toilet paper roll is almost empty, check to see if there are new rolls available. When a toilet paper roll is empty, replace it. If there are none, stock from storage. If storage is empty, ask mom or dad to add to the grocery list.',
  'When your room is messy and there are things on the floor that shouldn\'t be, pick them up.',
  'When a blanket or pillow is sitting on the floor after you use it, put it back nicely on the couch.',
  'When you walk by your sibling, your parents, or your child, give them a smile, a hug, or a high five.',
];

const BRAIN_GIGS = [
  'Pick a topic to research about and tell someone how you will apply it',
  'Pick a skill to learn and showcase it to someone in the family',
  'Plan a short family trip somewhere we can drive over a weekend (2–3 hrs away)',
  'Pick a room in the house to improve the design of and present your plans',
  'Pick a meal to be in charge of and make it one Sunday',
  'Invent a product and create a commercial for it',
  'Design a family logo or t-shirt',
  'Plan a family service project',
  'Learn how to sew on a button',
  'Find and plan a specific hike we can do as a family',
  'Think of a service you could offer and make $20 off of it',
  'Make a movie from one of our family trips',
  'Practice a skill that takes 7 days of practice',
  'Teach a younger sibling something new',
  'Read a book and give a book review',
  'Complete a fitness challenge and report results',
  'Inventory emergency supplies',
  'Create a list of unused items you could donate',
  'Write a thank you note and deliver it to someone',
  'Pick something to make out of wood',
  'Create a chart of where you/we spent money last month and consider ways to improve',
  'Call a family member and talk with them for 15 minutes',
  'Create a flyer/invitation for an upcoming event (family dinner/pool party/etc)',
  'Create an app like this',
  'Learn how to check the pool or hot tub chemicals',
];

const WORK_GIGS = [
  'Dust surfaces',
  'Weed an area',
  'Wipe down outdoor chairs',
  'Vacuum the pool',
  'Organize a room, a closet, or a cabinet',
  'Vacuum the basement',
  'Vacuum all stairs',
  'Clean a bathroom',
  'Clean the inside of all reachable windows',
  'Clean the sliding doors (and tracks)',
  'Water mom\'s plants for a week',
  'Mop the main floor',
  'Pick up sticks and debris in backyard',
  'Pick up Luna\'s poop for a week',
  'Do a week of clothes laundry by yourself',
  'Do the bedding laundry by yourself',
  'Touch up paint on scuffed walls',
  'Replace furnace filters',
  'Detail a car (inside)',
  'Trash duty for a week',
  'Water the garden for a week',
  'Prune some trees',
  'Pick up rocks in the sandpit',
  'Organize the pantry',
  'Clean lightswitches and door handles',
  'Take Luna for a walk or play fetch with her',
  'Bathe Luna',
  'Brush Luna',
  'Clean windowsills',
  'Organize a fridge and freezer',
  'Wipe down cabinets',
];

function makeGigs(titles: string[], type: Gig['type'], prefix: string): Gig[] {
  return titles.map((title, i) => ({
    id: `${prefix}-${i + 1}`,
    title,
    type,
  }));
}

export function createSeedState(): Pick<AppState, 'familyMembers' | 'gigs'> {
  return {
    familyMembers: DEFAULT_FAMILY,
    gigs: [
      ...makeGigs(KULEANA_ITEMS, 'kuleana', 'kuleana'),
      ...makeGigs(BRAIN_GIGS, 'brain', 'brain'),
      ...makeGigs(WORK_GIGS, 'work', 'work'),
    ],
  };
}
