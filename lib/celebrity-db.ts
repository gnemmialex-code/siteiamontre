// Celebrity database for prompt injection
// When a celebrity name is detected in a user prompt, their visual description
// is prepended so the AI model generates an accurate likeness even for
// French influencers not well-represented in training data.

export type Celebrity = {
  id: string;
  name: string;
  aliases: string[];
  gender: "male" | "female" | "duo" | "group";
  category: string;
  nationality: string;
  visual_description: string;
};

export const CELEBRITY_DB: Celebrity[] = [

  // ──────────────────────────────────────────────────────────────────────────
  // FRENCH GAMING / STREAMERS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "squeezie",
    name: "Squeezie",
    aliases: ["gabriel squeezio", "gabriel didal"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French YouTuber and gamer, late 20s male. Tall lean build (~180cm). Very dark brown, almost black short-to-medium hair, often slightly tousled. Dark brown eyes. Light skin. Narrow oval face with a thin jaw. Typically wears casual French streetwear: hoodies, graphic t-shirts, caps (Supreme, Nike, Jordan). Youthful, friendly, energetic expression.",
  },
  {
    id: "michou",
    name: "Michou",
    aliases: ["mickaël vendetta", "mickael vendetta"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer and YouTuber, early-to-mid 20s male. Signature platinum blonde / bleached white hair, short and styled upward. Light blue or grey eyes. Very round, full-cheeked face. Light skin. Slightly below average height, medium build. Wide infectious smile. Colorful casual streetwear style. Very recognizable for his bright blonde hair.",
  },
  {
    id: "inoxtag",
    name: "Inoxtag",
    aliases: ["inox", "inoxydable"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French-Algerian YouTuber and gamer, early 20s male. Short black hair, sometimes with a slight fade. Dark brown eyes. Olive/light-brown skin. Lean medium build. Oval face with defined features. Casual streetwear style: hoodies, joggers. Youthful and energetic French gaming influencer.",
  },
  {
    id: "amixem",
    name: "Amixem",
    aliases: ["florian fedérico", "florian federico"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French YouTuber, early 30s male. Brown/chestnut hair, medium length. Short beard or stubble. Green or hazel eyes. Light skin. Square jaw, athletic medium build. Relaxed casual style. Often seen with a slightly serious or focused expression.",
  },
  {
    id: "mcfly-carlito",
    name: "McFly & Carlito",
    aliases: ["mcfly", "carlito", "bryan mahe", "alexis patry"],
    gender: "duo",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French comedy YouTube duo, both mid-to-late 30s. McFly (Bryan): short brown hair, brown eyes, average build, light skin, casual relaxed style. Carlito (Alexis): dark black hair, dark eyes, beard or goatee, slightly olive/Mediterranean skin, medium build. Both wear casual everyday French style.",
  },
  {
    id: "cyprien",
    name: "Cyprien",
    aliases: ["cyprien iov"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French YouTuber and comedian, mid 30s male. Short brown hair, neatly styled. Blue eyes. Light skin. Slim build, slightly lanky. Oval face, elongated features. Very casual everyday French style (jeans, plain t-shirts). Clean-shaven or very light stubble.",
  },
  {
    id: "norman",
    name: "Norman",
    aliases: ["norman thavaud", "normanfaitdesvideos"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French YouTuber (less active), late 30s male. Brown hair, casual cut. Brown eyes. Light skin. Average build. Relaxed everyday French casual style. Friendly, approachable expression.",
  },
  {
    id: "tibo-inshape",
    name: "Tibo InShape",
    aliases: ["tibo", "thibault inshape"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness YouTuber and bodybuilder, early-to-mid 30s male. Extremely muscular physique, broad shoulders, defined arms and chest, very developed muscular build. Dark brown hair, short. Brown eyes. Light skin, slightly tanned. Square jaw. Often shirtless or in tight athletic wear to showcase physique.",
  },
  {
    id: "joyca",
    name: "Joyca",
    aliases: ["joris cantin"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French YouTuber and gamer, late 20s to early 30s male. Light brown/chestnut hair. Brown or hazel eyes. Light skin. Average lean build. Casual everyday style.",
  },
  {
    id: "mastu",
    name: "Mastu",
    aliases: ["mastuvu"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French YouTuber and streamer, early-to-mid 30s male. Dark brown or black hair, medium length. Beard or heavy stubble. Dark brown eyes. Light skin. Medium build. Casual gaming and everyday style.",
  },
  {
    id: "theodort",
    name: "Théodort",
    aliases: ["theodort", "theo dort", "theo streamer"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Brown hair. Light skin. Casual gaming style.",
  },
  {
    id: "seb",
    name: "Seb",
    aliases: ["seb la frite", "sebastien lhermitte", "sébastien lhermitte"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French gamer and YouTuber (SEB la frite), mid 30s male. Brown hair, often short. Beard or stubble. Light skin. Average build. Very casual relaxed gaming style.",
  },
  {
    id: "pierre-croce",
    name: "Pierre Croce",
    aliases: ["pierre croce"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French YouTuber and gamer, early-to-mid 30s male. Brown hair. Light skin. Average build. Casual everyday French style.",
  },
  {
    id: "gotaga",
    name: "Gotaga",
    aliases: ["corentin houssein"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French gamer and streamer, early 30s male. Short black hair, fade cut. Dark brown eyes. Olive/light-brown skin (North African-French heritage). Athletic compact build. Casual streetwear gaming style (Adidas, Nike). Defined jawline.",
  },
  {
    id: "domingo",
    name: "Domingo",
    aliases: ["quentin domingo"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer and gamer, early-to-mid 30s male. Brown hair, medium length. Beard or stubble. Brown eyes. Light skin. Medium build. Casual relaxed style.",
  },
  {
    id: "billy",
    name: "Billy",
    aliases: ["billy streamer", "billy fr"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Brown hair. Light skin. Casual gaming style.",
  },
  {
    id: "lebouseuh",
    name: "LeBouseuh",
    aliases: ["bouseuh", "le bouseuh", "remi"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Brown hair. Light skin. Casual gaming streetwear style.",
  },
  {
    id: "just-riadh",
    name: "Just Riadh",
    aliases: ["riadh", "riadh belaiche", "riadh belaïche"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French YouTuber and comedian of Tunisian descent, early 30s male. Black short hair. Dark brown eyes. Olive/medium-brown skin. Average build. Casual everyday style. Warm expressive smile.",
  },
  {
    id: "valouzz",
    name: "Valouzz",
    aliases: ["valouz"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer and gamer, mid-to-late 20s male. Dark brown hair. Light skin. Casual gaming style.",
  },
  {
    id: "pidi",
    name: "Pidi",
    aliases: ["pidi streamer"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Casual gaming style.",
  },
  {
    id: "sora",
    name: "Sora",
    aliases: ["sora streamer", "sora fr"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Dark hair. Casual gaming style.",
  },
  {
    id: "maxestla",
    name: "MaxEstLa",
    aliases: ["max est la", "max gaming"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French gamer and YouTuber, mid-to-late 20s male. Brown hair. Light skin. Casual gaming style.",
  },
  {
    id: "kameto",
    name: "Kameto",
    aliases: ["kévin diagne", "kevin diagne"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French-Senegalese streamer and gamer, late 20s male. Short black hair, sometimes afro. Dark brown/deep skin. Brown eyes. Athletic medium build. Streetwear gaming style. Energetic presence.",
  },
  {
    id: "zerator",
    name: "Zerator",
    aliases: ["antoine bournier", "ze rator"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, early 30s male. Brown hair, short. Brown eyes. Light skin. Average to slim build. Casual everyday gaming style.",
  },
  {
    id: "ponce",
    name: "Ponce",
    aliases: ["anthony hazael-massieux", "anthoponce"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, late 20s to early 30s male. Chestnut/light brown hair. Light skin. Casual gaming and everyday style.",
  },
  {
    id: "maghla",
    name: "Maghla",
    aliases: ["margaux streamer"],
    gender: "female",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, late 20s female. Blonde hair, medium length. Light blue or grey eyes. Light skin. Average build. Casual gaming and everyday style.",
  },
  {
    id: "ultia",
    name: "Ultia",
    aliases: ["mathilde galoyer"],
    gender: "female",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid-to-late 20s female. Often has dyed hair — pink, purple, or other bold colors. Light skin. Blue or light eyes. Slim build. Alternative, colorful, gaming aesthetic.",
  },
  {
    id: "chowh1",
    name: "Chowh1",
    aliases: ["chow"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Casual gaming style.",
  },
  {
    id: "mistermv",
    name: "MisterMV",
    aliases: ["martin victor", "mister mv"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, early 30s male. Brown hair, often messy or medium length. Beard. Sometimes wears glasses. Light skin. Average or slightly heavyset build. Casual geek/gaming style.",
  },
  {
    id: "etoiles",
    name: "Etoiles",
    aliases: ["alexandre danois", "étoiles"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, late 20s male. Dark hair. Light skin. Casual gaming style.",
  },
  {
    id: "locklear",
    name: "Locklear",
    aliases: ["locklear streamer"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer and gamer, mid-to-late 20s male. Dark brown hair. Light skin. Casual gaming style.",
  },
  {
    id: "vodK",
    name: "VodK",
    aliases: ["vodk", "vodk streamer"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid-to-late 20s male. Brown hair. Light skin. Casual gaming style.",
  },
  {
    id: "le-roi-des-rats",
    name: "Le Roi des Rats",
    aliases: ["roi des rats", "roiderats"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Dark hair. Casual gaming style.",
  },
  {
    id: "wankil-studio",
    name: "Wankil Studio",
    aliases: ["terracid", "laink", "terracid et laink", "laink et terracid"],
    gender: "duo",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French gaming YouTube duo. Terracid: mid 30s male, dark hair, beard, medium build, casual style. Laink: mid 30s male, brown hair, casual gaming style. Both light skin, casual gaming and comedy aesthetic.",
  },
  {
    id: "jl-tomy",
    name: "JL Tomy",
    aliases: ["tomy jl", "jl crew tomy"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Dark hair. Casual gaming style.",
  },
  {
    id: "jl-amine",
    name: "JL Amine",
    aliases: ["amine jl", "jl crew amine"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer of North African descent, mid 20s male. Black hair. Olive/medium skin. Casual gaming style.",
  },
  {
    id: "jl-bichou",
    name: "JL Bichou",
    aliases: ["bichou jl", "jl crew bichou"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Casual gaming style.",
  },
  {
    id: "enzo-foukra",
    name: "Enzo Foukra",
    aliases: ["enzo"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French YouTuber and gamer, early 20s male. Brown or dark hair. Light skin. Lean young build. Casual gaming and comedy style.",
  },
  {
    id: "alex-levand",
    name: "Alex Levand",
    aliases: ["alexlevand"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French gamer and streamer, mid 20s male. Brown hair. Light skin. Casual gaming style.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FRENCH EDUCATION / VULGARISATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "hugodecrypte",
    name: "HugoDécrypte",
    aliases: ["hugo decrypte", "hugo décrypte", "hugo travers"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French journalist and YouTuber, late 20s to early 30s male. Brown hair, well-groomed. Brown eyes. Light skin. Clean-shaven or very light stubble. Slim average build. Smart-casual or professional style: often in button-up shirts, blazers, or neat polos. Confident journalistic presence.",
  },
  {
    id: "nota-bene",
    name: "Nota Bene",
    aliases: ["notabene", "benjamin brillaud"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French history YouTuber, mid 30s male. Brown hair, sometimes with a beard. Occasionally wears glasses. Light skin. Average build. Smart casual style. Intellectual and calm demeanor.",
  },
  {
    id: "dr-nozman",
    name: "Dr Nozman",
    aliases: ["nozman", "nicolas beudin"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French science YouTuber, mid-to-late 30s male. Brown hair, trimmed beard. Light skin. Average build. Smart casual or slightly professional style. Curious and enthusiastic expression.",
  },
  {
    id: "poisson-fecond",
    name: "Poisson Fécond",
    aliases: ["poisson fecond"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French science YouTuber, mid 30s male. Brown hair. Light skin. Casual style.",
  },
  {
    id: "dirty-biology",
    name: "DirtyBiology",
    aliases: ["dirty biology", "léo bernard", "leo bernard"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French biology science YouTuber, early-to-mid 30s male. Brown hair, beard. Light skin. Casual relaxed style. Warm enthusiastic expression.",
  },
  {
    id: "cyrus-north",
    name: "Cyrus North",
    aliases: ["cyrusnorth"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French philosophy YouTuber, mid 30s male. Brown hair. Light skin. Smart casual intellectual style.",
  },
  {
    id: "gaspard-g",
    name: "Gaspard G",
    aliases: ["gaspard", "gaspard gaspard"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French chemistry science YouTuber, mid 30s male. Brown or dark hair. Light skin. Casual style.",
  },
  {
    id: "science-etonnante",
    name: "ScienceEtonnante",
    aliases: ["science etonnante", "david louapre"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French physics YouTuber, late 30s to early 40s male. Brown hair, beard. Light skin. Casual intellectual style.",
  },
  {
    id: "monsieur-phi",
    name: "Monsieur Phi",
    aliases: ["monsieurphi"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French philosophy YouTuber, mid 30s male. Brown hair. Light skin. Casual smart style.",
  },
  {
    id: "linguisticae",
    name: "Linguisticae",
    aliases: ["rémi fonteneau", "remi fonteneau"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French linguistics YouTuber, mid 30s male. Brown hair. Light skin. Casual intellectual style.",
  },
  {
    id: "le-monde",
    name: "Le Monde",
    aliases: ["le monde youtube"],
    gender: "group",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French journalism YouTube channel (Le Monde newspaper). Various journalists appear, typically in professional or smart-casual attire.",
  },
  {
    id: "le-tatou",
    name: "Le Tatou",
    aliases: ["le tatou youtube"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French science vulgarisation YouTuber, mid 30s male. Casual style.",
  },
  {
    id: "doc-seven",
    name: "Doc Seven",
    aliases: ["doc 7"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French medical/science YouTuber, mid 30s male. Casual or semi-professional style.",
  },
  {
    id: "le-rire-jaune",
    name: "Le Rire Jaune",
    aliases: ["rire jaune"],
    gender: "duo",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French comedy YouTube duo, both mid 30s. Light skin. Casual comedy style.",
  },
  {
    id: "le-monde-a-lenvers",
    name: "Le Monde à l'Envers",
    aliases: ["monde a lenvers", "monde à l'envers"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French vulgarisation YouTuber, mid 30s male. Casual style.",
  },
  {
    id: "antoine-daniel",
    name: "Antoine Daniel",
    aliases: ["antoinedaniel"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French comedy YouTuber, mid-to-late 30s male. Brown curly or wavy hair. Light skin. Casual relaxed style. Expressive comedic face.",
  },
  {
    id: "charles-villa",
    name: "Charles Villa",
    aliases: ["charlesvilla"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French vulgarisation YouTuber, mid 30s male. Brown hair. Light skin. Smart casual style.",
  },
  {
    id: "thinkerview",
    name: "Thinkerview",
    aliases: ["think erview"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French interview show host, mid 30s to 40s male. Beard and medium-length hair, often dark. Light skin. Intellectual casual style.",
  },
  {
    id: "mister-v",
    name: "Mister V",
    aliases: ["yvick letexier", "mistervofficial"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French actor, comedian, and YouTuber of Cameroonian descent, early-to-mid 30s male. Medium-length afro or tight curls. Beard. Dark brown/deep warm skin. Expressive, animated face. Medium athletic build. Varied stylish or casual attire.",
  },
  {
    id: "le-grand-jd",
    name: "Le Grand JD",
    aliases: ["grand jd", "jean dragan"],
    gender: "male",
    category: "fr_comedy",
    nationality: "be",
    visual_description:
      "Belgian-French comedian and YouTuber, mid-to-late 30s male. Brown or dark hair. Light skin. Casual style.",
  },
  {
    id: "doc-jazy",
    name: "Doc Jazy",
    aliases: ["docjazy"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French doctor and content creator of African descent, mid 30s male. Short black hair. Dark brown/warm skin. Professional or smart casual style.",
  },
  {
    id: "jean-onche",
    name: "Jean Onche",
    aliases: ["jeanonche"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French YouTuber and comedian, mid-to-late 20s male. Casual everyday French style.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FRENCH LIFESTYLE / INFLUENCEURS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "lena-situations",
    name: "Léna Situations",
    aliases: ["lena situations", "léna mahfouf", "lena mahfouf"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French-Algerian fashion influencer and YouTuber, mid 20s female. Long dark chestnut/brown hair, often straight or lightly wavy. Brown eyes. Oval face with refined features. Light to olive skin tone. Slim elegant build, medium height. Signature style: chic Parisian fashion, often in designer brands (Jacquemus, Valentino, Balmain). Very fashionable, polished appearance.",
  },
  {
    id: "natoo",
    name: "Natoo",
    aliases: ["natasha", "natoo youtube"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French YouTuber of Guadeloupean descent, early-to-mid 30s female. Often wears her hair very short/cropped or in natural textured styles. Dark brown/deep warm skin. Brown eyes. Tall, slim build. Alternative, colorful, eclectic style. Expressive and bold personality in her appearance.",
  },
  {
    id: "paola-locatelli",
    name: "Paola Locatelli",
    aliases: ["paola"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French-Italian model and influencer, early 20s female. Long dark chestnut/brown hair, usually straight. Brown eyes. Oval face with Mediterranean features. Olive/light Mediterranean skin. Slim model physique, tall. Chic fashion style blending Italian and French aesthetics. Very photogenic, natural beauty.",
  },
  {
    id: "sundy-jules",
    name: "Sundy Jules",
    aliases: ["sundy"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle influencer of Afro-Caribbean descent, mid-to-late 20s female. Natural hair, often in afro or braided styles. Warm dark brown skin. Expressive brown eyes. Medium build. Colorful, vibrant lifestyle fashion style.",
  },
  {
    id: "romy",
    name: "Romy",
    aliases: ["romy influencer", "romy fr"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle influencer, mid 20s female. Brown hair. Light skin. Fashion lifestyle style.",
  },
  {
    id: "mayadorable",
    name: "Mayadorable",
    aliases: ["maya adorable", "maya"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle and kawaii influencer, mid-to-late 20s female. Dark hair, often styled in cute kawaii-inspired ways or with colorful accessories. Light to medium skin tone. Round expressive face. Petite build. Cute, kawaii, pastel-inspired fashion aesthetic.",
  },
  {
    id: "carla-ginola",
    name: "Carla Ginola",
    aliases: ["carla"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French model and influencer (daughter of David Ginola), mid 20s female. Long dark brown or chestnut hair. Brown eyes. Light/Mediterranean skin. Tall slim model physique. Elegant chic style.",
  },
  {
    id: "chloe-b",
    name: "Chloé B",
    aliases: ["chloe b", "chloé influencer"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle influencer, mid 20s female. Brown hair. Light skin. Casual chic French style.",
  },
  {
    id: "camille-lv",
    name: "Camille LV",
    aliases: ["camille leblanc", "camille l v"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle influencer, mid 20s female. Blonde or light brown hair. Light skin. Blue or light eyes. Chic casual French style.",
  },
  {
    id: "juste-zoe",
    name: "Juste Zoé",
    aliases: ["juste zoe", "zoé"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle influencer, mid 20s female. Blonde hair. Light skin. Light eyes. Casual French lifestyle style.",
  },
  {
    id: "clara-marz",
    name: "Clara Marz",
    aliases: ["claramarz"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle influencer, mid 20s female. Brown hair. Light skin. Casual lifestyle style.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FRENCH BEAUTY / MUA
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "juju-fitcats",
    name: "Juju Fitcats",
    aliases: ["juju fitcats", "justine quintin"],
    gender: "female",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness and lifestyle influencer, late 20s female. Golden blonde to light brown hair, often long and wavy. Light hazel or brown eyes. Light skin with a natural light tan. Athletic toned physique. Glamour meets fitness style, often in activewear or casual chic.",
  },
  {
    id: "gaelle-garcia-diaz",
    name: "Gaëlle Garcia Diaz",
    aliases: ["gaelle garcia diaz", "gaelle garcia", "gaëlle garcia"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French-Spanish influencer and glamour model, early 30s female. Long dark brown or black hair, often straight and sleek. Dark brown eyes. Oval face with defined Mediterranean features. Olive/light-brown Mediterranean skin. Voluptuous figure. Glamorous fashion style.",
  },
  {
    id: "sissy-mua",
    name: "Sissy MUA",
    aliases: ["sissy", "sissymua"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French makeup artist and influencer, early 30s female. Signature extremely artistic and elaborate makeup looks as her visual identity. Hair often dyed or styled in dramatic ways. Medium build. Glamorous and bold beauty aesthetic — her transformative makeup is the most distinctive feature.",
  },
  {
    id: "enjoy-phoenix",
    name: "EnjoyPhoenix",
    aliases: ["enjoyphoenix", "marie lopez"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French beauty and lifestyle YouTuber, late 20s female. Chestnut/medium brown hair, often with blonde highlights or balayage. Green or blue-green eyes. Light skin. Slim build. Casual chic French style blending beauty and everyday life.",
  },
  {
    id: "sananas",
    name: "Sananas",
    aliases: ["sanam wae", "sanam waé"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French-Iranian beauty and lifestyle influencer, early 30s female. Long dark brown/black hair. Brown eyes. Warm golden/olive skin (Persian heritage). Oval face. Slim medium build. Glamorous beauty style blending Middle Eastern and French aesthetics.",
  },
  {
    id: "iris-mittenaere",
    name: "Iris Mittenaere",
    aliases: ["iris", "miss france", "miss univers 2016"],
    gender: "female",
    category: "fr_model",
    nationality: "fr",
    visual_description:
      "French model and former Miss France and Miss Universe 2016, late 20s female. Chestnut to light brown hair. Blue or light eyes. Light skin. Tall slim model physique (~177cm). Elegant high-fashion style.",
  },
  {
    id: "shera-kerienski",
    name: "Shera Kerienski",
    aliases: ["shera"],
    gender: "female",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness and glamour influencer, late 20s female. Dark brown hair, often long. Brown eyes. Light/slightly tanned skin. Very athletic, toned physique. Glamour fitness style.",
  },
  {
    id: "the-doll-beauty",
    name: "The Doll Beauty",
    aliases: ["doll beauty", "thedollbeauty"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French beauty influencer, mid-to-late 20s female. Dark hair. Light skin. Glamorous beauty makeup style.",
  },
  {
    id: "danae-makeup",
    name: "Danae Makeup",
    aliases: ["danae", "danaemakeup"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French beauty and makeup influencer, mid 20s female. Brown or dark hair. Light skin. Glamorous beauty style.",
  },
  {
    id: "marion-cameleon",
    name: "Marion Caméléon",
    aliases: ["marion cameleon", "marioncameleon"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French beauty influencer, late 20s female. Signature trait: constantly changing hair color and styles (her 'caméléon' identity — she regularly transforms her look with different colors and cuts). Light skin. Diverse and transformative beauty looks.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FRENCH FITNESS / SPORT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "nassim-sahili",
    name: "Nassim Sahili",
    aliases: ["nassim"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness influencer of North African descent, late 20s male. Black short hair. Olive/medium-brown skin. Muscular athletic physique. Fitness and lifestyle style.",
  },
  {
    id: "thibault-geoffray",
    name: "Thibault Geoffray",
    aliases: ["thibault"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness YouTuber and influencer, late 20s to early 30s male. Brown hair. Light skin. Athletic medium build. Fitness and lifestyle casual style.",
  },
  {
    id: "justine-gallice",
    name: "Justine Gallice",
    aliases: ["justine"],
    gender: "female",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness and lifestyle influencer, late 20s female. Blonde or light brown hair. Light skin. Toned athletic physique. Sporty and lifestyle casual style.",
  },
  {
    id: "yanisport",
    name: "Yanisport",
    aliases: ["yanis sport", "yanis"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness YouTuber, mid-to-late 20s male. Dark hair. Medium skin. Athletic muscular build. Fitness and sport style.",
  },
  {
    id: "bodytime",
    name: "Bodytime",
    aliases: ["body time"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness influencer, mid-to-late 20s male. Athletic muscular build. Fitness style.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FRENCH REALITY TV / CELEBRITY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "nabilla",
    name: "Nabilla",
    aliases: ["nabilla benattia"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French reality TV celebrity of Algerian-Turkish descent, early 30s female. Very long dark black hair, often with extensions straight and sleek. Dark brown eyes. Full lips, often with dramatic makeup. Voluptuous curvaceous figure. Olive/warm skin tone. Glamorous high-end style (Chanel, luxury brands). Very bold, striking appearance.",
  },
  {
    id: "maeva-ghennam",
    name: "Maeva Ghennam",
    aliases: ["maeva"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French reality TV influencer of Algerian descent, late 20s female. Dark hair, often with extensions (sometimes bleached tips or ombré). Dark eyes. Full lips. Olive/light skin. Glamorous style with dramatic makeup. Curvaceous figure.",
  },
  {
    id: "thibault-garcia",
    name: "Thibault Garcia",
    aliases: ["thibault garcia temptation"],
    gender: "male",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French reality TV personality, late 20s male. Dark brown hair, short. Light skin, slightly tanned. Athletic muscular build. Casual chic style.",
  },
  {
    id: "astrid-nelsia",
    name: "Astrid Nelsia",
    aliases: ["astrid"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French influencer of West African-Caribbean descent, late 20s female. Natural hair, often braided or in protective styles. Warm dark brown skin. Athletic build. Fitness meets glamour style.",
  },
  {
    id: "marine-el-himer",
    name: "Marine El Himer",
    aliases: ["marine elhimer"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French reality TV influencer (twin), late 20s female. Dark hair. Mediterranean olive/light-brown skin. Glamorous style.",
  },
  {
    id: "oceane-el-himer",
    name: "Océane El Himer",
    aliases: ["oceane el himer", "océane elhimer"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French reality TV influencer (twin sister of Marine), late 20s female. Dark hair. Mediterranean olive/light-brown skin. Very similar appearance to Marine El Himer. Glamorous style.",
  },
  {
    id: "laura-lempika",
    name: "Laura Lempika",
    aliases: ["laura"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French-Martinican reality TV influencer, late 20s female. Dark hair. Mixed-race warm brown skin. Glamorous lifestyle style.",
  },
  {
    id: "carla-moreau",
    name: "Carla Moreau",
    aliases: ["carla moreau jlc"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French reality TV personality (JLC Family), late 20s female. Dark brown hair. Light skin. Glamorous family lifestyle style.",
  },
  {
    id: "shanna-kress",
    name: "Shanna Kress",
    aliases: ["shanna"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French reality TV personality, late 20s to early 30s female. Dark hair. Light/Mediterranean skin. Glamorous style.",
  },
  {
    id: "kim-glow",
    name: "Kim Glow",
    aliases: ["kimglow"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French-Guadeloupean reality TV and social media influencer, late 20s female. Mixed heritage. Warm/light-brown skin. Dark hair. Glamorous glam style.",
  },
  {
    id: "sarah-fraisou",
    name: "Sarah Fraisou",
    aliases: ["sarah"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French reality TV personality, early 30s female. Dark hair. Light skin. Glamorous style.",
  },
  {
    id: "manon-tanti",
    name: "Manon Tanti",
    aliases: ["manon"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French reality TV influencer, late 20s female. Dark hair. Light skin. Glamorous lifestyle style.",
  },
  {
    id: "melanie-orl",
    name: "Mélanie Orl",
    aliases: ["melanie orl", "mélanie"],
    gender: "female",
    category: "fr_reality",
    nationality: "fr",
    visual_description:
      "French influencer, late 20s female. Dark hair. Light skin. Glamorous style.",
  },
  {
    id: "lea-mary",
    name: "Léa Mary",
    aliases: ["lea mary", "léa"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French influencer, mid-to-late 20s female. Brown or blonde hair. Light skin. Lifestyle style.",
  },
  {
    id: "ad-laurent",
    name: "AD Laurent",
    aliases: ["ad laurent", "adlaurent"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer and content creator, mid-to-late 20s male. Dark hair. Casual gaming style.",
  },
  {
    id: "gatooz",
    name: "Gatooz",
    aliases: ["gatoo z"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer, mid 20s male. Casual gaming style.",
  },
  {
    id: "mymi-rose",
    name: "Mymi Rose",
    aliases: ["mymi"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French influencer and content creator, mid-to-late 20s female. Dark or brown hair. Light skin. Lifestyle style.",
  },
  {
    id: "cassandra-calogera",
    name: "Cassandra Calogera",
    aliases: ["cassandra"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French influencer, mid-to-late 20s female. Dark hair, Mediterranean features. Olive/light skin. Glamorous lifestyle style.",
  },
  {
    id: "eva-elfie-fr",
    name: "Eva Elfie FR",
    aliases: ["eva elfie france"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator, mid 20s female. Dark hair. Light skin. Lifestyle style.",
  },
  {
    id: "lila-taleb",
    name: "Lila Taleb",
    aliases: ["lila"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French influencer, mid-to-late 20s female. Dark hair. Light/olive skin. Lifestyle style.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNATIONAL — YOUTUBE / TIKTOK
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "mrbeast",
    name: "MrBeast",
    aliases: ["mr beast", "jimmy donaldson"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTuber MrBeast (Jimmy Donaldson), mid 20s male. Tall (~6'3\"). Brown hair, often in a relaxed casual cut. Brown eyes. Light skin. Athletic lean build. Casual everyday American style (hoodies, t-shirts, caps). Wide infectious smile. Very recognizable friendly face.",
  },
  {
    id: "pewdiepie",
    name: "PewDiePie",
    aliases: ["pewdiepie", "felix kjellberg"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "Swedish YouTuber PewDiePie (Felix Kjellberg), mid-to-late 30s male. Blonde hair, various styles over the years (often short or medium). Blue or grey eyes. Light skin. Medium athletic build. Casual Scandinavian style.",
  },
  {
    id: "markiplier",
    name: "Markiplier",
    aliases: ["mark fischbach", "mark"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTuber Markiplier (Mark Fischbach), early-to-mid 30s male. Dark brown to black hair, often styled. Brown eyes. Light skin with mixed Korean-American heritage. Athletic muscular build. Casual style, often in dark clothing.",
  },
  {
    id: "mkbhd",
    name: "MKBHD",
    aliases: ["marques brownlee", "marques", "mkbhd tech"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American tech YouTuber MKBHD (Marques Brownlee), late 20s male. Black hair, short fade. Dark brown/deep skin (African-American). Tall (~6'3\") athletic build. Professional, clean-cut style (often in neat shirts, quality streetwear). Very sharp and polished appearance.",
  },
  {
    id: "casey-neistat",
    name: "Casey Neistat",
    aliases: ["casey"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American filmmaker and YouTuber, early-to-mid 40s male. Brown hair, often with signature sun- or ray-ban wayfarer glasses as his style trademark. Light skin. Athletic lean build. Casual New York street style (often in a t-shirt and jeans). Square jaw, defined features.",
  },
  {
    id: "logan-paul",
    name: "Logan Paul",
    aliases: ["logan"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTuber and influencer, late 20s male. Blonde hair. Blue eyes. Light skin. Very tall (~6'2\") and muscular build (boxer physique). Confident bold style.",
  },
  {
    id: "jake-paul",
    name: "Jake Paul",
    aliases: ["jake"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTuber and boxer, late 20s male. Blonde hair. Blue eyes. Light skin. Athletic muscular build. Bold streetwear style.",
  },
  {
    id: "ksi",
    name: "KSI",
    aliases: ["jj olatunji", "jj"],
    gender: "male",
    category: "int_youtube",
    nationality: "uk",
    visual_description:
      "British-Nigerian YouTuber and rapper KSI (JJ Olatunji), late 20s male. Dark brown/black hair in various styles. Dark brown/warm skin (Nigerian British heritage). Athletic boxing-trained build. Bold streetwear style.",
  },
  {
    id: "emma-chamberlain",
    name: "Emma Chamberlain",
    aliases: ["emma"],
    gender: "female",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTuber and influencer, early-to-mid 20s female. Light brown to chestnut hair, often casually styled or wavy. Hazel or brown eyes. Light skin. Slim average build. Very casual, relatable, effortlessly cool fashion style (often in vintage or oversized pieces).",
  },
  {
    id: "charli-damelio",
    name: "Charli D'Amelio",
    aliases: ["charli damelio", "charli"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American TikTok creator, early 20s female. Long dark brown hair. Brown eyes. Light skin. Slim build, dancer physique. Casual sporty American teen style (often in crop tops, joggers, Nike).",
  },
  {
    id: "addison-rae",
    name: "Addison Rae",
    aliases: ["addison"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American TikTok creator, early-to-mid 20s female. Light brown to dirty blonde hair, often long and wavy. Brown eyes. Light skin with a natural glow. Slim athletic build. Casual cheerful American style.",
  },
  {
    id: "bella-poarch",
    name: "Bella Poarch",
    aliases: ["bella"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "Filipino-American TikTok creator, mid 20s female. Dark hair in various styles (often black, sometimes dyed). Dark eyes. East Asian features. Light/fair skin. Petite slim build. Alternative, pop, or y2k-inspired style. Distinctive tattoos on arms.",
  },
  {
    id: "khaby-lame",
    name: "Khaby Lame",
    aliases: ["khaby"],
    gender: "male",
    category: "int_tiktok",
    nationality: "it",
    visual_description:
      "Senegalese-Italian TikTok creator, mid 20s male. Black short hair. Warm dark brown/deep skin. Tall lean build (~6'2\"). Expressive deadpan face. Casual simple style (often plain shirts). Very distinctive calm, understated comedic expression.",
  },
  {
    id: "zach-king",
    name: "Zach King",
    aliases: ["zach"],
    gender: "male",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American digital illusionist and TikToker, early 30s male. Dark hair. Light/medium skin. Average build. Clean casual style.",
  },
  {
    id: "brent-rivera",
    name: "Brent Rivera",
    aliases: ["brent"],
    gender: "male",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American TikToker and YouTuber, mid 20s male. Brown hair. Hazel or brown eyes. Light skin. Slim athletic build. Casual American style.",
  },
  {
    id: "lele-pons",
    name: "Lele Pons",
    aliases: ["lele"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "Venezuelan-American influencer and content creator, mid-to-late 20s female. Blonde hair, long and often wavy or curly. Brown eyes. Light/olive skin. Athletic slim build. Bold, fun Latin-American influenced style.",
  },
  {
    id: "david-dobrik",
    name: "David Dobrik",
    aliases: ["david"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "Slovak-American YouTuber, mid-to-late 20s male. Brown hair, casually styled. Brown eyes. Light skin. Average build. Casual hoodie-and-jeans American YouTuber style. Wide smile.",
  },
  {
    id: "ryan-trahan",
    name: "Ryan Trahan",
    aliases: ["ryan trahan"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTuber, mid 20s male. Brown hair. Light skin. Slim build. Casual everyday style.",
  },
  {
    id: "airrack",
    name: "Airrack",
    aliases: ["eric decker"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTuber, mid 20s male. Brown hair. Light skin. Casual everyday YouTube style.",
  },
  {
    id: "dhar-mann",
    name: "Dhar Mann",
    aliases: ["dharr mann"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "Indian-American YouTuber and entrepreneur, early 40s male. Black hair. Brown/warm skin. South Asian heritage. Average build. Business casual style.",
  },
  {
    id: "dream",
    name: "Dream",
    aliases: ["clay dream", "dreamwastaken"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American gaming YouTuber who revealed his face, mid 20s male. Brown hair, longer style. Light skin. Average build. Casual gaming style.",
  },
  {
    id: "sidemen",
    name: "Sidemen",
    aliases: ["sidemen group"],
    gender: "group",
    category: "int_youtube",
    nationality: "uk",
    visual_description:
      "British YouTuber group including KSI (Nigerian-British, dark skin), Miniminter (light skin, brown hair), Zerkaa (light skin, brown hair), TBJZL (dark skin, Nigerian-British), Behzinga (light skin, larger build), Vikkstar123 (British-Indian, medium skin, dark hair), and Harry (light skin, blonde). Casual streetwear UK style.",
  },
  {
    id: "linus-tech-tips",
    name: "Linus Tech Tips",
    aliases: ["linus", "ltt", "linus sebastian"],
    gender: "male",
    category: "int_youtube",
    nationality: "ca",
    visual_description:
      "Canadian tech YouTuber Linus Sebastian, mid 30s male. Brown hair. Light skin. Average build. Casual tech style (often in LTT merch or casual shirts).",
  },
  {
    id: "veritasium",
    name: "Veritasium",
    aliases: ["derek muller"],
    gender: "male",
    category: "int_youtube",
    nationality: "ca",
    visual_description:
      "Australian-Canadian science YouTuber Derek Muller, late 30s male. Brown hair. Blue eyes. Light skin. Casual professional science style.",
  },
  {
    id: "smarter-every-day",
    name: "SmarterEveryDay",
    aliases: ["smarter every day", "destin sandlin"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American science YouTuber Destin Sandlin, early 40s male. Brown hair. Light skin. Casual Southern American style.",
  },
  {
    id: "michelle-phan",
    name: "Michelle Phan",
    aliases: ["michelle"],
    gender: "female",
    category: "int_beauty",
    nationality: "us",
    visual_description:
      "Vietnamese-American beauty YouTuber, mid 30s female. Dark black hair in various styles. Dark eyes. Light/fair East Asian skin. Slim build. Elegant beauty and lifestyle style.",
  },
  {
    id: "lilly-singh",
    name: "Lilly Singh",
    aliases: ["iisuperwomanii", "superwoman"],
    gender: "female",
    category: "int_youtube",
    nationality: "ca",
    visual_description:
      "Canadian-Indian YouTuber, early 30s female. Long dark brown/black hair. Brown eyes. Medium-warm brown skin (Punjabi-Indian heritage). Athletic slim build. Bold colorful style.",
  },
  {
    id: "huda-kattan",
    name: "Huda Kattan",
    aliases: ["huda beauty", "huda"],
    gender: "female",
    category: "int_beauty",
    nationality: "us",
    visual_description:
      "Iraqi-American beauty mogul, late 30s female. Long dark brown to black hair (often with highlights or extensions). Brown eyes. Warm olive/medium skin (Middle Eastern heritage). Full lips. Curvaceous figure. Glamorous luxury beauty style (always impeccably made up).",
  },
  {
    id: "nikkie-tutorials",
    name: "NikkieTutorials",
    aliases: ["nikkie de jager", "nikkie"],
    gender: "female",
    category: "int_beauty",
    nationality: "nl",
    visual_description:
      "Dutch beauty YouTuber NikkieTutorials (Nikkie de Jager), late 20s female. Blonde or light hair (various styles over time). Blue eyes. Light skin. Very tall and statuesque build. Always beautifully and dramatically made up. Glamorous bold beauty style.",
  },
  {
    id: "james-charles",
    name: "James Charles",
    aliases: ["james"],
    gender: "male",
    category: "int_beauty",
    nationality: "us",
    visual_description:
      "American beauty YouTuber, mid 20s male. Brown hair (various styles). Brown eyes. Light skin. Often wears elaborate, artistic makeup looks. Slim build. Glamorous, bold fashion and beauty style.",
  },
  {
    id: "bretman-rock",
    name: "Bretman Rock",
    aliases: ["bretman"],
    gender: "male",
    category: "int_beauty",
    nationality: "us",
    visual_description:
      "Filipino-American beauty influencer, mid 20s male. Dark hair in various styles. Dark eyes. Filipino features, light-medium skin. Athletic build. Bold, extravagant beauty and fashion style.",
  },
  {
    id: "chiara-ferragni",
    name: "Chiara Ferragni",
    aliases: ["chiara"],
    gender: "female",
    category: "int_beauty",
    nationality: "it",
    visual_description:
      "Italian fashion influencer and entrepreneur, late 30s female. Blonde hair, long and often styled. Blue eyes. Light skin. Slim model figure. Signature high-fashion Italian luxury style (The Blonde Salad). Very chic and polished.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNATIONAL — GAMING / STREAMING
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "ninja",
    name: "Ninja",
    aliases: ["tyler blevins"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American gaming streamer Ninja (Tyler Blevins), early-to-mid 30s male. Signature dyed hair (most famously electric blue, but changes frequently). Brown eyes. Light skin. Average build. Gaming streetwear style. Distinctive headband often worn.",
  },
  {
    id: "pokimane",
    name: "Pokimane",
    aliases: ["imane anys"],
    gender: "female",
    category: "int_gaming",
    nationality: "ca",
    visual_description:
      "French-Moroccan Canadian streamer Pokimane (Imane Anys), late 20s female. Long dark brown to black hair. Brown eyes. Light olive/warm skin. Slim build. Casual cute streaming style (often hoodies, light makeup). Very popular gaming streamer aesthetic.",
  },
  {
    id: "kai-cenat",
    name: "Kai Cenat",
    aliases: ["kai"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer, early 20s male. Black hair in various styles. Dark brown/deep skin (African-American). Athletic medium build. Streetwear style (hoodies, jordans). Very energetic and expressive.",
  },
  {
    id: "ishowspeed",
    name: "IShowSpeed",
    aliases: ["speed", "darren watkins"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer IShowSpeed (Darren Watkins Jr.), early 20s male. Black short hair. Dark brown/warm deep skin (African-American). Slim athletic build. Casual streetwear style. Extremely expressive face and energetic personality.",
  },
  {
    id: "shroud",
    name: "Shroud",
    aliases: ["michael grzesiek"],
    gender: "male",
    category: "int_gaming",
    nationality: "ca",
    visual_description:
      "Polish-Canadian streamer Shroud (Michael Grzesiek), late 20s male. Brown hair. Brown eyes. Light skin. Average build. Casual gaming style.",
  },
  {
    id: "tfue",
    name: "Tfue",
    aliases: ["turner tenney"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer Tfue (Turner Tenney), mid-to-late 20s male. Blonde to brown hair. Blue or light eyes. Light skin. Athletic build. Casual everyday style.",
  },
  {
    id: "timthetatman",
    name: "TimTheTatman",
    aliases: ["tim"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer, early 30s male. Brown hair, beard. Light skin. Larger build. Casual everyday style.",
  },
  {
    id: "valkyrae",
    name: "Valkyrae",
    aliases: ["rachell hofstetter"],
    gender: "female",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "Filipino-American streamer Valkyrae (Rachell Hofstetter), late 20s female. Long dark black hair. Dark eyes. Light to medium East Asian-influenced skin. Slim build. Casual gaming and lifestyle style.",
  },
  {
    id: "sykkuno",
    name: "Sykkuno",
    aliases: ["thomas lu"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "Asian-American streamer Sykkuno (Thomas Lu), late 20s male. Black hair. Light/fair skin (Chinese-American heritage). Slim build. Casual shy-cute style, often in simple t-shirts.",
  },
  {
    id: "xqc",
    name: "xQc",
    aliases: ["felix lengyel", "xqcow"],
    gender: "male",
    category: "int_gaming",
    nationality: "ca",
    visual_description:
      "French-Canadian streamer xQc (Felix Lengyel), mid-to-late 20s male. Brown or dark hair (often short). Blue eyes. Light skin. Slim build. Casual gaming everyday style.",
  },
  {
    id: "dr-disrespect",
    name: "Dr Disrespect",
    aliases: ["dr disrespect", "beahm guy"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer, mid 40s male. Signature look: tall black mullet wig, dark thick mustache, wraparound dark sunglasses, black or camo tactical jacket. Very tall and imposing build. His theatrical costume is part of his brand identity.",
  },
  {
    id: "ludwig",
    name: "Ludwig",
    aliases: ["ludwig ahgren"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer Ludwig (Ludwig Ahgren), mid 20s male. Brown hair. Brown eyes. Light skin. Average build. Casual cozy streaming style.",
  },
  {
    id: "asmongold",
    name: "Asmongold",
    aliases: ["zack"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American gaming streamer, early 30s male. Blonde hair, sometimes longer and unkempt. Brown or hazel eyes. Light skin. Average build. Very casual minimal style.",
  },
  {
    id: "amouranth",
    name: "Amouranth",
    aliases: ["kaitlyn siragusa"],
    gender: "female",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer and content creator (SFW context only), late 20s female. Signature long auburn/red hair, often in waves or various costumes. Green eyes. Light skin. Curvaceous figure. Cosplay-influenced and bold style.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNATIONAL — CELEBRITIES / ATHLETES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "kim-kardashian",
    name: "Kim Kardashian",
    aliases: ["kim k", "kim kardashian west"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American media personality, early-to-mid 40s female. Long dark black hair (sometimes styled differently). Dark brown eyes. Warm olive/medium skin (Armenian-American heritage). Famously curvaceous hourglass figure. Ultra-glamorous designer luxury style (Balenciaga, Skims, haute couture).",
  },
  {
    id: "kylie-jenner",
    name: "Kylie Jenner",
    aliases: ["kylie"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American media personality and beauty entrepreneur, mid-to-late 20s female. Dark brown to black hair (sometimes dyed or with wigs). Brown eyes. Full lips. Warm olive skin. Curvaceous slim figure. Ultra-trendy luxury fashion style.",
  },
  {
    id: "kendall-jenner",
    name: "Kendall Jenner",
    aliases: ["kendall"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American supermodel, mid-to-late 20s female. Long dark brown hair. Brown eyes. Light skin. Extremely tall and slim model physique (~5'10\"). High-fashion model style (Chanel, Burberry runway). Very sharp and angular facial features.",
  },
  {
    id: "hailey-bieber",
    name: "Hailey Bieber",
    aliases: ["hailey baldwin", "hailey"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American model, mid-to-late 20s female. Blonde hair, often straight and glossy. Blue eyes. Light skin. Very slim tall model figure. Minimalist chic 'glazed donut' aesthetic style.",
  },
  {
    id: "dixie-damelio",
    name: "Dixie D'Amelio",
    aliases: ["dixie"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American content creator and singer, early 20s female. Brown or dark blonde hair. Brown eyes. Light skin. Slim build. Casual American fashion style.",
  },
  {
    id: "sommer-ray",
    name: "Sommer Ray",
    aliases: ["sommer"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American fitness model and influencer, mid 20s female. Long brown/chestnut hair. Light brown eyes. Light skin with a tan. Very athletic and toned physique. Fitness and lifestyle casual style.",
  },
  {
    id: "selena-gomez",
    name: "Selena Gomez",
    aliases: ["selena"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American singer and actress of Mexican-American heritage, early 30s female. Dark brown hair, medium to long. Brown eyes. Warm light/olive skin. Slim medium build. Casual chic or elegant red-carpet style.",
  },
  {
    id: "beyonce",
    name: "Beyoncé",
    aliases: ["beyonce", "queen bey"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American superstar Beyoncé, early-to-mid 40s female. Often long blonde/highlighted hair (extensions). Brown eyes. Warm brown skin (African-American heritage). Curvaceous powerful figure. Iconic, glamorous, and theatrical style — from casual to haute couture to stage outfits.",
  },
  {
    id: "cristiano-ronaldo",
    name: "Cristiano Ronaldo",
    aliases: ["ronaldo", "cr7"],
    gender: "male",
    category: "int_athlete",
    nationality: "pt",
    visual_description:
      "Portuguese soccer superstar Cristiano Ronaldo, late 30s male. Dark brown hair, very well-groomed (often with a fade or slicked-back style). Hazel or light brown eyes. Light/Mediterranean skin. Extremely muscular athletic physique, tall (~6'2\"). Defined jawline and chiseled facial features. Designer style on and off the field.",
  },
  {
    id: "lionel-messi",
    name: "Lionel Messi",
    aliases: ["messi", "leo messi"],
    gender: "male",
    category: "int_athlete",
    nationality: "ar",
    visual_description:
      "Argentine soccer legend Lionel Messi, late 30s male. Dark brown hair and beard. Brown eyes. Olive/medium-tan skin (South American heritage). Shorter stature (~5'7\") but extremely athletic build. Recognizable by his beard and humble, understated presence.",
  },
  {
    id: "neymar",
    name: "Neymar",
    aliases: ["neymar jr", "neymar jr."],
    gender: "male",
    category: "int_athlete",
    nationality: "br",
    visual_description:
      "Brazilian soccer star Neymar Jr., early 30s male. Often has distinctive unique hairstyle (mohawk, bleached tips, braids — changes regularly). Brown eyes. Warm medium/brown skin (Brazilian heritage). Athletic lean build. Very stylish and fashionable sportswear to luxury street style.",
  },
  {
    id: "drake",
    name: "Drake",
    aliases: ["aubrey graham", "champagnepapi"],
    gender: "male",
    category: "int_celebrity",
    nationality: "ca",
    visual_description:
      "Canadian rapper and global celebrity Drake (Aubrey Graham), late 30s male. Short black hair (fade cut) and beard. Dark brown/warm skin (African-Canadian heritage). Athletic medium build. Signature OVO luxury streetwear style.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNATIONAL — ADULT CONTENT CREATORS (SFW CONTEXT ONLY)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "belle-delphine",
    name: "Belle Delphine",
    aliases: ["belle delphine"],
    gender: "female",
    category: "int_adult",
    nationality: "uk",
    visual_description:
      "British content creator, mid 20s female. Signature pink hair (her most recognizable look, though changes styles). Blue or grey eyes. Light/pale skin. Petite slim build. Kawaii-influenced pastel aesthetic, often with cosplay elements. Large expressive eyes, doll-like face. (SFW output only.)",
  },
  {
    id: "corinna-kopf",
    name: "Corinna Kopf",
    aliases: ["corinna"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American influencer and content creator, mid-to-late 20s female. Blonde hair, long and often wavy. Blue eyes. Light skin. Slim athletic figure. Casual American influencer style. (SFW output only.)",
  },
  {
    id: "jem-wolfie",
    name: "Jem Wolfie",
    aliases: ["jem"],
    gender: "female",
    category: "int_adult",
    nationality: "au",
    visual_description:
      "Australian fitness model and content creator, late 20s to early 30s female. Dark brown hair. Brown eyes. Light/tan skin. Very athletic and muscular fitness physique. Fitness lifestyle style. (SFW output only.)",
  },
  {
    id: "emily-black",
    name: "Emily Black",
    aliases: ["emilyblack"],
    gender: "female",
    category: "int_adult",
    nationality: "uk",
    visual_description:
      "British content creator, mid 20s female. Brown or dark hair. Brown eyes. Light skin. Slim figure. Casual lifestyle style. (SFW output only.)",
  },
  {
    id: "lauren-alexis",
    name: "Lauren Alexis",
    aliases: ["lauren"],
    gender: "female",
    category: "int_adult",
    nationality: "uk",
    visual_description:
      "British content creator, mid 20s female. Blonde hair. Light eyes. Light skin. Slim build. Casual British lifestyle style. (SFW output only.)",
  },
  {
    id: "lena-the-plug",
    name: "Lena The Plug",
    aliases: ["lena plug"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator, late 20s female. Dark hair. Brown eyes. Light skin. Athletic slim build. Casual lifestyle style. (SFW output only.)",
  },
  {
    id: "sky-bri",
    name: "Sky Bri",
    aliases: ["skybri"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator, mid 20s female. Blonde hair. Light eyes. Light skin. Slim figure. Casual lifestyle style. (SFW output only.)",
  },
  {
    id: "ana-cheri",
    name: "Ana Cheri",
    aliases: ["anacheri"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American fitness model and content creator, early 30s female. Dark brown or black hair. Brown eyes. Light/medium tan skin (mixed Caucasian-Persian heritage). Very athletic curvaceous physique. Fitness glamour style. (SFW output only.)",
  },
  {
    id: "hannah-owo",
    name: "Hannah Owo",
    aliases: ["hannah"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator, early-to-mid 20s female. Brown hair. Brown eyes. Light skin. Slim build. Kawaii-inspired casual style. (SFW output only.)",
  },
  {
    id: "kinsey-wolanski",
    name: "Kinsey Wolanski",
    aliases: ["kinsey"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American model and influencer, late 20s female. Blonde hair, long. Blue eyes. Light skin. Slim athletic figure. Lifestyle glamour style. (SFW output only.)",
  },
  {
    id: "abby-rao",
    name: "Abby Rao",
    aliases: ["abby"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American influencer, mid 20s female. Blonde hair. Blue eyes. Light skin. Slim athletic figure. Lifestyle casual style. (SFW output only.)",
  },
  {
    id: "katie-sigmond",
    name: "Katie Sigmond",
    aliases: ["katie"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American TikTok influencer, early 20s female. Blonde hair. Blue eyes. Light skin. Slim build. Casual lifestyle style. (SFW output only.)",
  },
  {
    id: "jack-doherty",
    name: "Jack Doherty",
    aliases: ["jack"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTuber, early 20s male. Blonde or light hair. Blue eyes. Light skin. Average build. Casual American style.",
  },
  {
    id: "bryce-hall",
    name: "Bryce Hall",
    aliases: ["bryce"],
    gender: "male",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American TikToker, mid 20s male. Brown hair. Brown eyes. Light skin. Athletic medium build. Casual American style.",
  },
  {
    id: "harry-jowsey",
    name: "Harry Jowsey",
    aliases: ["harry too hot to handle"],
    gender: "male",
    category: "int_celebrity",
    nationality: "au",
    visual_description:
      "Australian influencer (Too Hot To Handle), late 20s male. Blonde or light brown hair. Blue eyes. Light skin. Tall athletic muscular build. Casual beach lifestyle style.",
  },
];

// ─── Detection helpers ──────────────────────────────────────────────────────

export function findAllCelebrities(text: string): Celebrity[] {
  const lower = text.toLowerCase();
  const found: Celebrity[] = [];
  const seen = new Set<string>();

  for (const celeb of CELEBRITY_DB) {
    if (seen.has(celeb.id)) continue;
    const names = [celeb.name.toLowerCase(), ...celeb.aliases.map((a) => a.toLowerCase())];
    if (names.some((n) => lower.includes(n))) {
      found.push(celeb);
      seen.add(celeb.id);
    }
  }
  return found;
}

export function buildCelebrityContext(celebs: Celebrity[]): string {
  if (celebs.length === 0) return "";
  const entries = celebs.map(
    (c) =>
      `CELEBRITY VISUAL REFERENCE — ${c.name.toUpperCase()}: ${c.visual_description}`,
  );
  return entries.join(" | ") + " ";
}
