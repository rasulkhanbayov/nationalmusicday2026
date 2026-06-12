// Editorial content for the home page. Edit freely — kept separate from
// layout so non-developers can update copy easily.

export const ARTISTS = [
  {
    name: "Leyla Aliyeva",
    role: "Pianist",
    bio: "A celebrated interpreter of Azerbaijani and Romantic repertoire, Leyla has performed across Europe and brings the lyricism of Gara Garayev to the keyboard.",
  },
  {
    name: "Rashid Mammadov",
    role: "Tar Virtuoso",
    bio: "Master of the tar, the soul of Azerbaijani music. Rashid bridges centuries-old mugham tradition with the concert stage.",
  },
  {
    name: "Nigar Hasanova",
    role: "Soprano",
    bio: "Acclaimed for her interpretations of Uzeyir Hajibeyov's vocal works, Nigar's voice carries the romance of Azerbaijani art song.",
  },
  {
    name: "Munich Chamber Ensemble",
    role: "String Quartet",
    bio: "A Munich-based quartet specialising in cross-cultural programmes, joining our soloists for an evening of shared musical heritage.",
  },
] as const;

export const PROGRAM = [
  {
    part: "Part I",
    pieces: [
      { composer: "Uzeyir Hajibeyov", title: "Overture from \"Koroglu\"" },
      { composer: "Gara Garayev", title: "Seven Beauties — Waltz & Adagio" },
      { composer: "Fikret Amirov", title: "Azerbaijan Capriccio" },
    ],
  },
  {
    part: "Interval",
    pieces: [{ composer: "", title: "20 minutes" }],
  },
  {
    part: "Part II",
    pieces: [
      { composer: "Traditional Mugham", title: "Bayatı-Şiraz (tar & ensemble)" },
      { composer: "Tofig Guliyev", title: "Selected Romances" },
      { composer: "Vagif Mustafazadeh", title: "Jazz-Mugham Improvisations" },
    ],
  },
] as const;

export const ABOUT_MUSIC_DAY = `Azerbaijan's National Music Day is celebrated each September in honour of Uzeyir Hajibeyov, the founder of Azerbaijani classical music and composer of the nation's anthem. The day commemorates a musical heritage that fuses the modal richness of mugham with the forms of the European classical tradition — a synthesis that produced some of the 20th century's most distinctive composers.`;
