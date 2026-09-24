// ============================================================
//  PORTFOLIO CONTENT
//  Edit this file to update the website. Every "TODO" is a
//  placeholder waiting for your real information.
//  Images go in /public/images/... and are referenced like
//  "images/games/my-game.jpg". Leave `image: null` to show a
//  generated placeholder instead.
// ============================================================

export const profile = {
  name: 'Jésica Bernal Galindo',
  role: 'Game QA Tester',
  tagline:
    'I break games so players don’t have to. Manual QA tester focused on finding, reproducing and documenting bugs clearly.', // TODO: make it yours
  location: 'Spain',
  available: false, // shows the "Open to work" badge
  currentJob: {
    company: 'Entalto Publishing',
    url: 'https://entaltostudios.com/', // e.g. the company website
  }, // set to null to hide
  cvUrl: 'cv.pdf', // put your CV at /public/cv.pdf
  about: [
    // TODO: rewrite in your own words
    'I’m a manual QA tester with hands-on experience testing video games across different genres and platforms. I enjoy digging into edge cases, writing clear and reproducible bug reports, and working closely with developers to get issues fixed.',
    'I’m currently studying Multiplatform Application Development (DAM), which helps me understand how games and apps are built from the inside — and makes me a better tester.',
  ],
  stats: [
    { value: '15', label: 'Games tested' },
    { value: '1000+', label: 'Bugs reported' }, // TODO
    { value: '6', label: 'Platforms' }, // TODO
  ],
}

// Pixel avatar in the hero. Change the colors to look like you.
export const avatar = {
  hair: '#b3940e', // TODO
  skin: '#f2c29b', // TODO
  shirt: '#e3e3e3',
  headset: '#0f51ea',
  // Speech bubble lines, cycled when someone clicks the avatar
  lines: [
    'Hi! Welcome to my portfolio.',
    'I test games for a living. Yes, really.',
    'Found any bugs yet?',
    'Currently leveling up in DAM.',
    'Tip: try the Konami code…',
  ],
}

// Career map: work and studies, in order. The last "locked"
// level is added automatically.
export const journey = [
  {
    level: '1-1',
    type: 'study',
    title: '3D Animation, games and interactive environments',
    place: 'CPFIP Los Enlaces',
    period: '2019 - 2021',
    description: 'TODO: short description.',
  },
  {
    level: '1-2',
    type: 'work',
    title: 'QA Tester',
    place: 'Kraken Empire',
    period: '2022 – 2025',
    description: 'Lead QA, Localization Data-base and level design',
    current: false,
  },
  {
    level: '1-3',
    type: 'study',
    title: 'Advanced Technician in Cross-Platform Application Development',
    place: 'Salesianos Zaragoza, Nuestra señora del Pilar',
    period: '2025 – Present',
    description: 'Higher vocational degree: Java, C#, Android, databases and software development.',
    current: true,
  },
  {
    level: '1-4',
    type: 'work',
    title: 'QA Tester',
    place: 'Entalto Publishing',
    period: '2025 – Present',
    description:
      'Manual QA on PC and console releases (PlayStation, Xbox, Nintendo Switch) for the Entalto Publishing catalog.',
    current: true,
  },
]

// Example bug report. Fictional on purpose: real reports are under NDA.
export const bugReport = {
  id: 'BUG-0427',
  title: '[Inventory] Game softlocks when opening the inventory during autosave',
  build: 'v0.9.3 (build 1452)',
  platform: 'PS5 · also Xbox Series X',
  area: 'UI / Save system',
  severity: 'Critical',
  priority: 'High',
  reproducibility: '8/10',
  preconditions: ['Save file with at least one item in the inventory', 'Autosave enabled (default setting)'],
  steps: [
    'Load the save and go to the checkpoint at the start of Chapter 2',
    'Walk through the checkpoint to trigger an autosave',
    'While the autosave icon is visible, press Options to open the inventory',
  ],
  expected: 'The inventory opens after the autosave finishes, or the input is ignored until it ends.',
  actual:
    'The inventory opens with a black background and stops responding. The game does not accept any input; only closing the app recovers it.',
  notes:
    'Does not reproduce with autosave disabled. Not reproducible on PC. The save file is not corrupted after restarting.',
  attachments: ['softlock_repro.mp4', 'crash_log_1452.txt', 'savegame_slot2.dat'],
}

// What makes the report above a good one (shown next to it)
export const bugReportTips = [
  'Title says where and what happens',
  'Exact build and platform',
  'How often it reproduces',
  'Short, numbered steps anyone can follow',
  'Expected vs actual result',
  'Evidence attached: video, logs, save',
]

export const links = {
  email: 'jbernal@entaltostudios.com',
  linkedin: 'https://es.linkedin.com/in/jesica-bernal-304aa4172', 
  github: 'https://github.com/bernalgajes25-ctrl',
}

// General QA work, shown once above the game cards
export const qaResponsibilities = [
  // TODO: adjust to what you actually do day to day
  'Functional, regression and smoke testing of new builds',
  'Writing clear bug reports with repro steps, video and logs',
  'Verifying fixes and closing issues',
  'Console compliance checks (PlayStation, Xbox, Nintendo)',
  'Localization checks: missing strings, truncated text, corrupted fonts',
]

// Games you have tested (newest first).
// `tasks` and `tools` are optional: add them to highlight
// something specific you did on a game.
export const games = [
  {
    title: 'SOMBRAS: negative frames',
    studio: 'Maboroshi Artworks / Entalto Publishing',
    year: 'In development',
    platforms: ['PC', 'PS5', 'Xbox Series', 'Switch 2'],
    genre: 'Horror adventure',
    role: 'QA Tester',
    image: 'images/games/sombras.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/4553370/SOMBRAS_negative_frames/',
  },
  {
    title: 'The Alighieri Circle: Dante’s Bloodline',
    studio: 'One-O-One Games / Entalto Publishing',
    year: '2026',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch'],
    genre: 'Psychological thriller · Puzzle',
    role: 'QA Tester',
    image: 'images/games/alighieri-circle.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/4262620/The_Alighieri_Circle_Dantes_Bloodline/',
  },
  {
    title: 'Fear Tall Grass',
    studio: 'Forgotten Bastions / Entalto Publishing',
    year: 'In development',
    platforms: ['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch'],
    genre: 'Roguelite creature battler',
    role: 'QA Tester',
    image: 'images/games/fear-tall-grass.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/4418130/Fear_Tall_Grass/',
  },
  {
    title: 'HYPERWIRED',
    studio: 'SIDRALGAMES / Entalto Publishing',
    year: '2026',
    platforms: ['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch'],
    genre: 'Roguelike shooter',
    role: 'QA Tester',
    image: 'images/games/hyperwired.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/3234850/HYPERWIRED/',
  },
  {
    title: 'Void Reaver',
    studio: 'Banana Blitz Studio',
    year: 'In development',
    platforms: ['PC'],
    genre: 'Sci-fi bullet heaven',
    role: 'QA Tester',
    image: 'images/games/void-reaver.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/4096910/Void_Reaver/',
  },
  {
    title: 'She’s Leaving',
    studio: 'Blue Hat Studio',
    year: '2025',
    platforms: ['PC'], // TODO: add consoles if you tested them
    genre: 'Survival horror',
    role: 'QA Tester',
    image: 'images/games/shes-leaving.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/3062610/Shes_Leaving/',
  },
  {
    title: 'Ink Inside',
    studio: 'Blackfield Entertainment / Entalto Publishing',
    year: '2025',
    platforms: ['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch'],
    genre: 'Action RPG',
    role: 'QA Tester',
    image: 'images/games/ink-inside.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/2137880/Ink_Inside/',
  },
  {
    title: 'Emotionless: The Last Ticket',
    studio: 'X1 Games',
    year: '2025',
    platforms: ['PC'],
    genre: 'Psychological horror',
    role: 'QA Tester',
    image: 'images/games/emotionless.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/3570000/EMOTIONLESS__The_Last_Ticket/',
  },
  {
    title: 'Knightica',
    studio: 'Mad Mango Games',
    year: '2025',
    platforms: ['PC', 'PS5'],
    genre: 'Roguelike auto-battler',
    role: 'QA Tester',
    image: 'images/games/knightica.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/3093400/Knightica/',
  },
  {
    title: 'SpongeBob: Krusty Cook-Off',
    studio: 'Nukebox Studios / Tilting Point',
    year: '2025',
    platforms: ['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One'],
    genre: 'Cooking · Time management',
    role: 'QA Tester',
    image: 'images/games/spongebob-krusty-cook-off.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/3592510/SpongeBob_Krusty_CookOff/',
  },
  {
    title: 'Day of the Shell',
    studio: 'Duper Games / Goblinz & Entalto Publishing',
    year: '2025',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch'],
    genre: 'Strategy roguelite',
    role: 'QA Tester',
    image: 'images/games/day-of-the-shell.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/3008340/Day_of_the_Shell/',
  },
  {
    title: 'LUTO',
    studio: 'Broken Bird Games',
    year: '2025',
    platforms: ['PC', 'PS5', 'Xbox Series'],
    genre: 'Psychological horror',
    role: 'QA Tester',
    image: 'images/games/luto.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/1729740/Luto/',
  },
  {
    title: 'Two Strikes',
    studio: 'Retro Reactor / Entalto Publishing',
    year: '2025',
    platforms: ['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch'],
    genre: '2D fighting',
    role: 'QA Tester',
    image: 'images/games/two-strikes.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/1586750/Two_Strikes/',
  },
  {
    title: 'Toy Tactics',
    studio: 'Kraken Empire / Joystick Ventures',
    year: '2024',
    platforms: ['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch'],
    genre: 'Physics-based RTS',
    role: 'QA Tester',
    image: 'images/games/toy-tactics.jpg',
    tasks: [],
    tools: ['Jira', 'Trello'],
    link: 'https://store.steampowered.com/app/1772530/Toy_Tactics/',
  },
  {
    title: 'Last Time I Saw You',
    studio: 'Maboroshi Artworks / Chorus Worldwide',
    year: '2024',
    platforms: ['PC', 'Switch', 'PlayStation'],
    genre: 'Narrative adventure',
    role: 'QA Tester',
    image: 'images/games/last-time-i-saw-you.jpg',
    tasks: [],
    tools: [],
    link: 'https://store.steampowered.com/app/1909750/Last_Time_I_Saw_You/',
  },
]

export const skills = [
  {
    group: 'QA',
    items: [
      'Manual testing',
      'Functional testing',
      'Regression testing',
      'Exploratory testing',
      'Smoke testing',
      'Compliance / TRC',
      'Localization QA',
      'Bug reporting',
      'Test cases',
    ],
  },
  {
    group: 'Tools',
    items: ['Jira', 'TestRail', 'Mantis', 'Confluence', 'OBS (video capture)', 'Excel / Sheets'],
  },
  {
    group: 'Development (DAM)',
    items: ['Java', 'Kotlin', 'SQL', 'Android', 'Git', 'HTML / CSS', 'React'],
  },
  {
    group: 'Soft skills',
    items: ['Attention to detail', 'Clear communication', 'Teamwork', 'English'],
  },
]

// DAM / programming projects
export const devProjects = [
  {
    title: 'This portfolio',
    description: 'My personal portfolio, built with React and Vite.',
    stack: ['React', 'Vite', 'CSS'],
    repo: null, // TODO: GitHub URL
    demo: null,
  },
  {
    title: 'DAM Project', // TODO
    description: 'Short description of what the app does and what you learned.',
    stack: ['Java', 'SQL'],
    repo: null,
    demo: null,
  },
]

// Blender renders (small "Other" gallery)
export const renders = [
  { title: 'Render one', image: null }, // TODO: 'images/blender/render-1.jpg'
  { title: 'Render two', image: null },
  { title: 'Render three', image: null },
]
