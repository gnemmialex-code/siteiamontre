// Celebrity database — accurate physical descriptions for AI prompt injection.
// Descriptions are in English so the model can process them directly.
// When a celebrity name is detected in a user prompt, their description is
// prepended as a CELEBRITY APPEARANCE REFERENCE so the model generates
// their authentic likeness rather than an invented generic face.

export type Celebrity = {
  id: string;
  name: string;
  aliases: string[];
  gender: "male" | "female" | "duo" | "group";
  category: string;
  nationality: string;
  visual_description: string;
  /** Stable public photo URL used as second image input for better likeness */
  reference_image_url?: string;
};

export const CELEBRITY_DB: Celebrity[] = [

  // ──────────────────────────────────────────────────────────────────────────
  // DIVERTISSEMENT / HUMOUR (FRANCE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "squeezie",
    name: "Squeezie",
    aliases: ["gabriel squeezio", "gabriel didal"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French YouTuber (music, gaming, concepts). Male, ~1.65m, slim but slightly muscular. Ash-blonde hair, blue eyes, fair skin. Youthful juvenile face. Oversized streetwear: hoodies, graphic tees, caps.",
  },
  {
    id: "michou",
    name: "Michou",
    aliases: ["mickaël vendetta", "mickael vendetta"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French vlogger (humor, dance). Male, ~1.75m, slim dynamic build. Platinum blonde hair, brown eyes, three-day stubble. Colorful relaxed style: flashy sweaters, sneakers.",
  },
  {
    id: "inoxtag",
    name: "Inoxtag",
    aliases: ["inox", "inoxydable"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French YouTuber (extreme challenges, adventure). Male, ~1.80m, athletic sporty build. Medium-length brown hair, green eyes, olive skin. Angular face. Sports or casual outdoor wear.",
  },
  {
    id: "amixem",
    name: "Amixem",
    aliases: ["florian fedérico", "florian federico"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French YouTuber (humor, gaming, vlogs). Male, ~1.78m, average build. Brown hair, hazel eyes, full thick beard. Relaxed boho-chic look: shirts, casual blazers.",
  },
  {
    id: "mcfly",
    name: "McFly",
    aliases: ["mcfly carlito", "bryan mahe", "mcfly et carlito"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French comedian duo McFly & Carlito. Male, ~1.75m, normal build. Bald head, dark brown beard, brown eyes. Casual: jeans, t-shirt. Mischievous smile.",
  },
  {
    id: "carlito",
    name: "Carlito",
    aliases: ["carlito mcfly", "alexis patry", "mcfly et carlito"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French comedian duo McFly & Carlito. Male, ~1.80m, slightly heavy build. Long brown hair tied back, beard, light eyes. Casual: denim jacket, bandana.",
  },
  {
    id: "mister-v",
    name: "Mister V",
    aliases: ["yvick letexier", "mistervofficial", "mister v"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French comedian and actor of Cameroonian descent. Male, ~1.85m, athletic build. Mixed race, short curly black hair, brown eyes. Streetwear: baggy pants, gold chain. Discreet tattoos.",
  },
  {
    id: "seb",
    name: "Seb",
    aliases: ["seb du sud", "sebastien du sud", "seb la frite"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor YouTuber. Male, ~1.72m, slim. Brown hair, green eyes. Chill look: shorts, t-shirt, cap. Fine face, small beard.",
  },
  {
    id: "theodort",
    name: "Théodort",
    aliases: ["theodort", "theo dort"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French hidden-camera and humor YouTuber. Male, ~1.70m, slim energetic silhouette. Brown hair, brown eyes, thick eyebrows. Young: Adidas tracksuit, cap.",
  },
  {
    id: "just-riadh",
    name: "Just Riadh",
    aliases: ["riadh", "riadh belaiche", "riadh belaïche"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French storytelling and humor creator. Male, ~1.78m, normal build. Mixed race, wavy black hair, brown eyes. Neat beard. Urban look: long coat, sneakers.",
  },
  {
    id: "sundy-jules",
    name: "Sundy Jules",
    aliases: ["sundy", "sundy jules"],
    gender: "male",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle and fashion male creator. ~1.82m, slim and elegant. Bleached blonde hair, blue eyes. Fashion style: fitted jacket, wide-leg trousers. Angular face, bright white smile.",
  },
  {
    id: "natoo",
    name: "Natoo",
    aliases: ["natasha", "natoo youtube"],
    gender: "female",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor and sketch creator. Female, ~1.65m, curvy build. Brown hair, hazel eyes, long hair often tied up. Quirky colorful look. Very expressive face.",
  },
  {
    id: "cyprien",
    name: "Cyprien",
    aliases: ["cyprien iov"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor YouTuber (less active). Male, ~1.70m, slim. Brown hair, brown eyes. Few-days beard, sometimes glasses. Simple: jeans, sweater.",
  },
  {
    id: "norman",
    name: "Norman",
    aliases: ["norman thavaud"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor vlogger (less active). Male, ~1.65m, small build. Brown hair, brown eyes. Casual hoodie and t-shirt. Round face, goofy smile.",
  },
  {
    id: "pierre-croce",
    name: "Pierre Croce",
    aliases: ["pierre croce"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French stand-up comedian and YouTuber. Male, ~1.75m, normal build. Brown hair, brown eyes, short beard, styled hair. Smart-casual: jacket, shirt.",
  },
  {
    id: "joyca",
    name: "Joyca",
    aliases: ["joris cantin"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor, gaming and vlog creator. Male, ~1.80m, slim. Blonde hair, blue eyes. Colorful: pink sweater, sneakers. Fine face, mischievous look.",
  },
  {
    id: "mastu",
    name: "Mastu",
    aliases: ["mastuvu"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor and gaming YouTuber. Male, ~1.78m, average build. Brown hair, brown eyes, beard, glasses. Geek-chic hooded sweatshirt.",
  },
  {
    id: "lebouseuh",
    name: "LeBouseuh",
    aliases: ["bouseuh", "le bouseuh"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor, gaming and challenge streamer. Male, ~1.75m, sporty build. Brown hair, brown eyes. Street: cap, jogging. Round face, mocking smile.",
  },
  {
    id: "valouzz",
    name: "Valouzz",
    aliases: ["valouz"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor vlogger. Male, ~1.77m, normal build. Brown hair, brown eyes. Relaxed: t-shirt, jeans. Nascent beard.",
  },
  {
    id: "pidi",
    name: "Pidi",
    aliases: ["pidi streamer"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French gaming humor creator. Male, ~1.70m, slim. Blonde hair, blue eyes. Young: sweatshirt, beanie. Baby-faced appearance.",
  },
  {
    id: "doc-jazy",
    name: "Doc Jazy",
    aliases: ["docjazy"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor and music creator. Male, ~1.75m, normal build. Brown hair, brown eyes, beard, sometimes long hair. Rock look: leather jacket.",
  },
  {
    id: "le-grand-jd",
    name: "Le Grand JD",
    aliases: ["grand jd", "jean dragan"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French comedian and chronicler. Male, ~1.80m, average build. Brown hair, brown eyes, beard. Casual-chic look.",
  },
  {
    id: "poisson-fecond",
    name: "Poisson Fécond",
    aliases: ["poisson fecond"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French absurdist humor YouTuber. Male, ~1.70m, slim. Brown hair, brown eyes. Quirky: round glasses, vintage coat.",
  },
  {
    id: "le-rire-jaune",
    name: "Le Rire Jaune",
    aliases: ["rire jaune"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French parody and humor YouTuber. Male, ~1.75m, normal build. Brown hair, brown eyes. Simple look, cap.",
  },
  {
    id: "le-roi-des-rats",
    name: "Le Roi des Rats",
    aliases: ["roi des rats", "roiderats"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French absurd humor streamer. Male, ~1.72m, slim. Brown hair, brown eyes. Dark style: black clothing, piercing.",
  },
  {
    id: "antoine-daniel",
    name: "Antoine Daniel",
    aliases: ["antoinedaniel"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French media critic and humor creator. Male, ~1.80m, normal build. Brown hair, brown eyes, beard. Intellectual: glasses, shirt.",
  },
  {
    id: "le-monde-a-lenvers",
    name: "Le Monde à l'Envers",
    aliases: ["monde a lenvers"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French parody humor YouTuber. Male, ~1.78m, normal build. Brown hair, brown eyes. Relaxed casual style.",
  },
  {
    id: "maxestla",
    name: "MaxEstLa",
    aliases: ["max est la"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor vlogger. Male, ~1.75m, slim. Blonde hair, blue eyes. Young casual: sweatshirt, cap.",
  },
  {
    id: "le-tatou",
    name: "Le Tatou",
    aliases: ["le tatou youtube"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French prank and hidden-camera YouTuber. Male, ~1.70m, stocky build. Brown hair, brown eyes. Street: big sneakers.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LIFESTYLE / BEAUTÉ (FRANCE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "lena-situations",
    name: "Léna Situations",
    aliases: ["lena situations", "léna mahfouf", "lena mahfouf"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French fashion vlogger and author. Female, ~1.58m, slim. Brown hair, brown eyes, mid-length with bangs. Modern Parisian: blazer, jeans, ankle boots. Fine face, fair skin.",
  },
  {
    id: "romy",
    name: "Romy",
    aliases: ["romy influencer", "romy fr"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French beauty and lifestyle creator. Female, ~1.65m, slim. Blonde hair, blue eyes, long wavy hair. Glamorous: fitted dress, heels. Soft face, full lips.",
  },
  {
    id: "paola-locatelli",
    name: "Paola Locatelli",
    aliases: ["paola"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French mixed-race actress and lifestyle creator. Female, ~1.70m, slim. Brown curly hair, hazel eyes. Fashion structured pieces. High cheekbones, bright smile.",
  },
  {
    id: "mayadorable",
    name: "Mayadorable",
    aliases: ["maya adorable", "maya"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French humor and lifestyle creator. Female, ~1.60m, normal build. Brown hair, brown eyes, long hair. Natural minimal-makeup look, jeans. Round face, friendly.",
  },
  {
    id: "sananas",
    name: "Sananas",
    aliases: ["sanam wae", "sanam waé"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French beauty creator. Female, ~1.65m, slim. Brown hair, green eyes, long straight hair. Sophisticated: blazer, scarf. Fine face, fair skin.",
  },
  {
    id: "enjoy-phoenix",
    name: "EnjoyPhoenix",
    aliases: ["enjoyphoenix", "marie lopez"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French beauty, wellness and cooking creator. Female, ~1.70m, normal build. Blonde hair, blue eyes, mid-length hair. Soft pastel style: flowy dresses. Angelic face.",
  },
  {
    id: "shera-kerienski",
    name: "Shera Kerienski",
    aliases: ["shera"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French beauty and body-positive creator. Female, ~1.68m, curvy build. Mixed race, brown curly hair, brown eyes. Assertive: fitted outfits, vivid colors. Full cheeks, wide smile.",
  },
  {
    id: "carla-ginola",
    name: "Carla Ginola",
    aliases: ["carla ginola"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French fashion and luxury influencer. Female, ~1.75m, slim. Blonde hair, blue eyes, long hair. Luxury: tailored suit, designer bag. Aristocratic fine face.",
  },
  {
    id: "chloe-b",
    name: "Chloé B",
    aliases: ["chloe b"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French skincare and beauty creator. Female, ~1.62m, slim. Brown hair, brown eyes, mid-length hair. Natural minimal-makeup, soft sweaters. Young face, flawless skin.",
  },
  {
    id: "clara-marz",
    name: "Clara Marz",
    aliases: ["claramarz"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle, music and vlog creator. Female, ~1.67m, slim. Brown wavy hair, hazel eyes. Artistic: vintage jewelry, colorful jackets. Expressive face.",
  },
  {
    id: "nabilla",
    name: "Nabilla",
    aliases: ["nabilla benattia"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French glamour and reality-TV celebrity. Female, ~1.70m, slim. Brown hair, brown eyes, long straight hair. Ultra-glamorous with surgically-enhanced lips. Crop top, stiletto heels.",
  },
  {
    id: "iris-mittenaere",
    name: "Iris Mittenaere",
    aliases: ["iris", "miss france", "miss univers 2016"],
    gender: "female",
    category: "fr_model",
    nationality: "fr",
    visual_description:
      "French Miss France and Miss Universe 2016. Female, ~1.63m, slim. Brown hair, brown eyes, mid-length. Elegant: evening dress, suit. Symmetrical face, perfect smile.",
  },
  {
    id: "camille-lv",
    name: "Camille LV",
    aliases: ["camille leblanc"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French fashion and luxury influencer. Female, ~1.72m, slim. Blonde hair, blue eyes. Bourgeois-chic: trench coat, sunglasses. Fine face.",
  },
  {
    id: "juste-zoe",
    name: "Juste Zoé",
    aliases: ["juste zoe"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French lifestyle and travel creator. Female, ~1.65m, normal build. Brown hair, brown eyes. Bohemian: long dresses, hat. Soft face.",
  },
  {
    id: "the-doll-beauty",
    name: "The Doll Beauty",
    aliases: ["doll beauty", "thedollbeauty"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French beauty and makeup creator. Female, ~1.60m, slim. Brown hair, brown eyes. Glamorous: false lashes, heavy contouring. Doll-like face.",
  },
  {
    id: "danae-makeup",
    name: "Danae Makeup",
    aliases: ["danae", "danaemakeup"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French professional makeup artist. Female, ~1.62m, slim. Brown hair, hazel eyes. Creative: colorful makeup, black clothing.",
  },
  {
    id: "marion-cameleon",
    name: "Marion Caméléon",
    aliases: ["marion cameleon", "marioncameleon"],
    gender: "female",
    category: "fr_beauty",
    nationality: "fr",
    visual_description:
      "French fashion and costume creator. Female, ~1.68m, normal build. Brown hair, brown eyes. Chameleon identity: constantly changes hairstyle and look. Neutral base face.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FITNESS / SPORT (FRANCE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "tibo-inshape",
    name: "Tibo InShape",
    aliases: ["tibo", "thibault inshape"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French bodybuilding YouTuber. Male, ~1.85m, extremely muscular bodybuilder physique. Bald head, brown eyes, tanned skin. Defined pectorals, visible veins. Tank top, shorts. Often shirtless.",
  },
  {
    id: "juju-fitcats",
    name: "Juju Fitcats",
    aliases: ["juju fitcats", "justine quintin"],
    gender: "female",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness and nutrition creator. Female, ~1.65m, athletic with visible abs. Blonde hair, blue eyes, long hair usually tied up. Sportswear: leggings, sports bra. Pretty determined face.",
  },
  {
    id: "sissy-mua",
    name: "Sissy MUA",
    aliases: ["sissy", "sissymua"],
    gender: "female",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness program creator. Female, ~1.68m, athletic with well-developed glutes. Brown hair, brown eyes, long hair. Fitted sportswear. Made-up face.",
  },
  {
    id: "nassim-sahili",
    name: "Nassim Sahili",
    aliases: ["nassim"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French bodybuilding coach. Male, ~1.78m, very muscular. Brown hair, brown eyes, beard. Street-fitness: tracksuit, cap. Visible tattoos.",
  },
  {
    id: "enzo-foukra",
    name: "Enzo Foukra",
    aliases: ["enzo foukra", "enzo"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness and motivation creator. Male, ~1.80m, lean muscular. Brown hair, brown eyes. Street: baggy, tank top. Angular face.",
  },
  {
    id: "yanisport",
    name: "Yanisport",
    aliases: ["yanis sport", "yanis"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French sports coach YouTuber. Male, ~1.75m, athletic. Brown hair, brown eyes. Clean: white t-shirt, shorts. Friendly face.",
  },
  {
    id: "bodytime",
    name: "Bodytime",
    aliases: ["body time"],
    gender: "duo",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness duo. Two muscular men, shaved or bearded, ~1.80m each. Classic fitness look: gloves, belt.",
  },
  {
    id: "alex-levand",
    name: "Alex Levand",
    aliases: ["alexlevand"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness and lifestyle creator. Male, ~1.83m, lean muscular. Brown hair, brown eyes. Fit-influencer: fitted sweatshirt, smartwatch.",
  },
  {
    id: "jean-onche",
    name: "Jean Onche",
    aliases: ["jeanonche"],
    gender: "male",
    category: "fr_comedy",
    nationality: "fr",
    visual_description:
      "French humor and bodybuilding creator. Male, ~1.75m, massive heavy build. Bearded, bald or very short hair. Quirky: humor t-shirt, jogging.",
  },
  {
    id: "thibault-geoffray",
    name: "Thibault Geoffray",
    aliases: ["thibault geoffray"],
    gender: "male",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French nutrition and fitness creator. Male, ~1.78m, naturally athletic. Brown hair, brown eyes. Healthy: fleece, sneakers. Young face.",
  },
  {
    id: "justine-gallice",
    name: "Justine Gallice",
    aliases: ["justine gallice"],
    gender: "female",
    category: "fr_fitness",
    nationality: "fr",
    visual_description:
      "French fitness and lifestyle creator. Female, ~1.67m, athletic. Blonde hair, blue eyes, long hair. Sports: neon leggings.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GAMING / STREAMING (FRANCE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "gotaga",
    name: "Gotaga",
    aliases: ["corentin houssein"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer and ex-professional FPS player. Male, ~1.78m, normal build. Mixed race, short black hair, brown eyes. Street: cap, sweatshirt. Light beard.",
  },
  {
    id: "domingo",
    name: "Domingo",
    aliases: ["quentin domingo"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French gaming host and streamer. Male, ~1.75m, average build. Brown hair, brown eyes, glasses. Casual: shirt, jeans. Smiling friendly face.",
  },
  {
    id: "kameto",
    name: "Kameto",
    aliases: ["kévin diagne", "kevin diagne"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer and KCorp CEO. Male, ~1.80m, stocky but muscular. Dark black hair, heavy beard, brown eyes. KCorp branded tracksuit. Broad strong face.",
  },
  {
    id: "zerator",
    name: "Zerator",
    aliases: ["antoine bournier"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French gaming event organizer and streamer. Male, ~1.78m, normal build. Brown hair, beard, brown eyes. Simple: t-shirt, cap. Thick prominent eyebrows.",
  },
  {
    id: "ponce",
    name: "Ponce",
    aliases: ["anthony hazael-massieux", "anthoponce"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French chill streamer. Male, ~1.72m, slim. Brown hair, mustache, brown eyes. Relaxed: wide loose sweater.",
  },
  {
    id: "maghla",
    name: "Maghla",
    aliases: ["margaux streamer"],
    gender: "female",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French gaming streamer. Female, ~1.65m, slim. Brown hair, brown eyes, long hair. Subtle gothic: black clothing, silver jewelry. Pale complexion.",
  },
  {
    id: "ultia",
    name: "Ultia",
    aliases: ["mathilde galoyer"],
    gender: "female",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French gaming streamer. Female, ~1.62m, slim. Blonde hair, blue eyes, long hair. Pastel kawaii: pink and unicorn aesthetic. Doll-like face.",
  },
  {
    id: "chowh1",
    name: "Chowh1",
    aliases: ["chow"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French FPS streamer. Male, ~1.80m, sporty build. Brown hair, brown eyes. Street: cap, jogging.",
  },
  {
    id: "mistermv",
    name: "MisterMV",
    aliases: ["martin victor", "mister mv"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French variety streamer. Male, ~1.75m, normal build. Bearded, glasses. Geek: retro gaming t-shirt.",
  },
  {
    id: "etoiles",
    name: "Etoiles",
    aliases: ["alexandre danois", "étoiles"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French variety streamer. Male, ~1.78m, young build. Brown hair, brown eyes. Simple: sweatshirt, jeans. Fine face.",
  },
  {
    id: "locklear",
    name: "Locklear",
    aliases: ["locklear streamer"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer. Male, ~1.80m, normal build. Brown hair, brown eyes. Casual everyday.",
  },
  {
    id: "jl-tomy",
    name: "JL Tomy",
    aliases: ["tomy jl", "jl crew tomy"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer (JL family). Male, ~1.70m, slim. Brown hair, glasses. Relaxed casual.",
  },
  {
    id: "jl-amine",
    name: "JL Amine",
    aliases: ["amine jl", "jl crew amine"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer (JL family). Male, ~1.75m, normal build. Brown hair, brown eyes.",
  },
  {
    id: "jl-bichou",
    name: "JL Bichou",
    aliases: ["bichou jl", "jl crew bichou"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer (JL family). Male, ~1.72m, slightly stocky. Brown hair.",
  },
  {
    id: "terracid",
    name: "Terracid",
    aliases: ["terracid wankil", "wankil studio terracid"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French humor streamer (Wankil Studio duo). Male, ~1.78m, normal build. Brown hair, brown eyes. Simple casual.",
  },
  {
    id: "laink",
    name: "Laink",
    aliases: ["laink wankil", "wankil studio laink"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French humor streamer (Wankil Studio duo). Male, ~1.80m, slim. Brown hair, brown eyes. Simple casual.",
  },
  {
    id: "vodk",
    name: "VodK",
    aliases: ["vodk streamer"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer. Male, ~1.77m, normal. Brown hair, brown eyes. Casual gaming.",
  },
  {
    id: "sora",
    name: "Sora",
    aliases: ["sora streamer", "sora fr"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer. Male, mid-20s. Dark hair. Casual gaming style.",
  },
  {
    id: "ad-laurent",
    name: "AD Laurent",
    aliases: ["ad laurent", "adlaurent"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer and content creator. Male, ~1.85m, muscular, numerous tattoos on arms and chest. Brown eyes, beard. Bad-boy: gold chain, leather jacket.",
  },
  {
    id: "gatooz",
    name: "Gatooz",
    aliases: ["gatoo z"],
    gender: "male",
    category: "fr_gaming",
    nationality: "fr",
    visual_description:
      "French streamer. Male, ~1.82m, muscular, full beard, brown eyes. Virile. Street: sweatshirt, jogging.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ÉDUCATION / VULGARISATION (FRANCE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "hugodecrypte",
    name: "HugoDécrypte",
    aliases: ["hugo decrypte", "hugo décrypte", "hugo travers"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French journalist and news YouTuber. Male, ~1.80m, slim. Brown hair, brown eyes, neatly styled. Casual-chic: shirt, jeans. Serious composed face.",
  },
  {
    id: "nota-bene",
    name: "Nota Bene",
    aliases: ["notabene", "benjamin brillaud"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French history YouTuber. Male, ~1.75m, normal build. Brown hair, brown eyes, beard. Intellectual: roll-neck sweater, sometimes glasses.",
  },
  {
    id: "dr-nozman",
    name: "Dr Nozman",
    aliases: ["nozman", "nicolas beudin"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French science YouTuber. Male, ~1.78m, normal. Brown hair, brown eyes, beard. Relaxed geek: science t-shirt.",
  },
  {
    id: "dirty-biology",
    name: "DirtyBiology",
    aliases: ["dirty biology", "léo bernard", "leo bernard"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French biology YouTuber with humor. Male, ~1.80m, slim, long hair. Brown hair, brown eyes. Hipster: full beard, flannel check shirt.",
  },
  {
    id: "cyrus-north",
    name: "Cyrus North",
    aliases: ["cyrusnorth"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French philosophy YouTuber. Male, ~1.75m, normal. Brown hair, brown eyes, beard. Simple casual.",
  },
  {
    id: "gaspard-g",
    name: "Gaspard G",
    aliases: ["gaspard"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French politics and economics YouTuber. Male, ~1.82m, slim. Brown hair, brown eyes. BCBG: tailored suit or blazer.",
  },
  {
    id: "science-etonnante",
    name: "ScienceEtonnante",
    aliases: ["science etonnante", "david louapre"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French physics YouTuber. Male, ~1.70m, normal. Brown hair, brown eyes, glasses. Professor look.",
  },
  {
    id: "monsieur-phi",
    name: "Monsieur Phi",
    aliases: ["monsieurphi"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French philosophy YouTuber. Male, ~1.78m, normal. Brown hair, brown eyes, beard. University intellectual.",
  },
  {
    id: "linguisticae",
    name: "Linguisticae",
    aliases: ["rémi fonteneau", "remi fonteneau"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French linguistics YouTuber. Male, ~1.75m, normal. Brown hair, brown eyes. Casual.",
  },
  {
    id: "charles-villa",
    name: "Charles Villa",
    aliases: ["charlesvilla"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French geography and history YouTuber. Male, ~1.80m, slim. Brown hair, brown eyes. Modern casual.",
  },
  {
    id: "doc-seven",
    name: "Doc Seven",
    aliases: ["doc 7"],
    gender: "male",
    category: "fr_education",
    nationality: "fr",
    visual_description:
      "French medical content creator. Male, ~1.75m. Casual semi-professional.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // +18 / GLAMOUR (FRANCE) — SFW OUTPUT ONLY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "mymi-rose",
    name: "Mymi Rose",
    aliases: ["mymi"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.62m, generous curvy figure (large chest, wide hips). Brown hair, brown eyes, long hair. Glamorous. (SFW output only.)",
  },
  {
    id: "eva-elfie-fr",
    name: "Eva Elfie FR",
    aliases: ["eva elfie france"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.63m, slim. Blonde hair, blue eyes, long hair. Girl-next-door: light dress. Juvenile face. (SFW output only.)",
  },
  {
    id: "lila-taleb",
    name: "Lila Taleb",
    aliases: ["lila taleb"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.65m, athletic. Brown hair, brown eyes. (SFW output only.)",
  },
  {
    id: "cassandra-calogera",
    name: "Cassandra Calogera",
    aliases: ["cassandra"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.68m, curvy. Brown hair, hazel eyes. Glamorous. (SFW output only.)",
  },
  {
    id: "lea-mary",
    name: "Léa Mary",
    aliases: ["lea mary", "léa"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.67m, slim. Blonde hair, blue eyes. Natural. (SFW output only.)",
  },
  {
    id: "astrid-nelsia",
    name: "Astrid Nelsia",
    aliases: ["astrid"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.70m, athletic. Mixed race, curly natural hair. Exotic style. (SFW output only.)",
  },
  {
    id: "marine-el-himer",
    name: "Marine El Himer",
    aliases: ["marine elhimer"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.65m, slim. Brown hair, brown eyes. Glamorous. (SFW output only.)",
  },
  {
    id: "oceane-el-himer",
    name: "Océane El Himer",
    aliases: ["oceane el himer"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.64m, slim. Brown hair, brown eyes. Near-identical twin of Marine El Himer. (SFW output only.)",
  },
  {
    id: "melanie-orl",
    name: "Mélanie Orl",
    aliases: ["melanie orl"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.68m, curvy. Brown hair, green eyes. (SFW output only.)",
  },
  {
    id: "maeva-ghennam",
    name: "Maeva Ghennam",
    aliases: ["maeva"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French glamour influencer. Female, ~1.70m, generous curves (notable chest and hips). Brown hair, brown eyes. Very glamorous: crop top, leggings. (SFW output only.)",
  },
  {
    id: "sarah-fraisou",
    name: "Sarah Fraisou",
    aliases: ["sarah fraisou"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.65m, full-figured. Brown hair, brown eyes. Body-positive. (SFW output only.)",
  },
  {
    id: "laura-lempika",
    name: "Laura Lempika",
    aliases: ["laura lempika"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.72m, slim. Brown hair, brown eyes. Glamorous. (SFW output only.)",
  },
  {
    id: "manon-tanti",
    name: "Manon Tanti",
    aliases: ["manon tanti"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.63m, normal build. Brown hair, brown eyes. (SFW output only.)",
  },
  {
    id: "carla-moreau",
    name: "Carla Moreau",
    aliases: ["carla moreau"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.60m, short and slim. Brown hair, brown eyes. (SFW output only.)",
  },
  {
    id: "shanna-kress",
    name: "Shanna Kress",
    aliases: ["shanna"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.70m, athletic. Brown hair, green eyes. (SFW output only.)",
  },
  {
    id: "kim-glow",
    name: "Kim Glow",
    aliases: ["kimglow"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French content creator (SFW). Female, ~1.68m, slim. Blonde hair, blue eyes. Glowing glittery makeup style. (SFW output only.)",
  },
  {
    id: "gaelle-garcia-diaz",
    name: "Gaëlle Garcia Diaz",
    aliases: ["gaelle garcia diaz", "gaelle garcia"],
    gender: "female",
    category: "fr_lifestyle",
    nationality: "fr",
    visual_description:
      "French glamour influencer. Female, ~1.72m, sculpted body (abs, prominent glutes). Long brown hair. Luxury look. (SFW output only.)",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNATIONAL ADULT CONTENT — SFW OUTPUT ONLY
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "amouranth",
    name: "Amouranth",
    aliases: ["kaitlyn siragusa"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American streamer and content creator (SFW only). Female, ~1.65m, very generous curves. Signature long red/auburn hair, green eyes. Kawaii or glamour style. (SFW output only.)",
  },
  {
    id: "belle-delphine",
    name: "Belle Delphine",
    aliases: ["belle delphine"],
    gender: "female",
    category: "int_adult",
    nationality: "uk",
    visual_description:
      "British content creator (SFW only). Female, ~1.62m, slim. Signature pink hair, blue eyes. Kawaii: fairy ears, heavy doll-like makeup. (SFW output only.)",
  },
  {
    id: "corinna-kopf",
    name: "Corinna Kopf",
    aliases: ["corinna kopf", "corinna"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Female, ~1.70m, slim slender. Blonde hair, blue eyes. Californian casual. (SFW output only.)",
  },
  {
    id: "jem-wolfie",
    name: "Jem Wolfie",
    aliases: ["jem wolfie"],
    gender: "female",
    category: "int_adult",
    nationality: "au",
    visual_description:
      "Australian fitness content creator (SFW). Female, ~1.68m, athletic with prominent glutes. Brown hair, brown eyes. Sportswear. (SFW output only.)",
  },
  {
    id: "violet-myers",
    name: "Violet Myers",
    aliases: ["violet myers"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Female, ~1.60m, generous curves. Brown hair, brown eyes. Latina style. (SFW output only.)",
  },
  {
    id: "emily-black",
    name: "Emily Black",
    aliases: ["emily black"],
    gender: "female",
    category: "int_adult",
    nationality: "uk",
    visual_description:
      "British content creator (SFW). Female, ~1.65m, slim. Brown hair, brown eyes. Girl-next-door. (SFW output only.)",
  },
  {
    id: "lauren-alexis",
    name: "Lauren Alexis",
    aliases: ["lauren alexis"],
    gender: "female",
    category: "int_adult",
    nationality: "uk",
    visual_description:
      "British content creator (SFW). Female, ~1.67m, slim. Brown hair, brown eyes. British glam. (SFW output only.)",
  },
  {
    id: "lena-the-plug",
    name: "Lena The Plug",
    aliases: ["lena plug", "lena the plug"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Female, ~1.70m, athletic, tattoos. Brown hair, brown eyes. Spicy fitness look. (SFW output only.)",
  },
  {
    id: "sky-bri",
    name: "Sky Bri",
    aliases: ["sky bri", "skybri"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Female, ~1.73m, slim. Blonde hair, blue eyes, long hair. Californian beach style. (SFW output only.)",
  },
  {
    id: "karina-pedro",
    name: "Karina Pedro",
    aliases: ["karina pedro"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Female, ~1.62m, generous curves. Brown hair, brown eyes. Latina style. (SFW output only.)",
  },
  {
    id: "ana-cheri",
    name: "Ana Cheri",
    aliases: ["ana cheri"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American fitness model and content creator (SFW). Female, ~1.68m, very athletic (abs, glutes). Brown hair, green eyes. Sport-chic. (SFW output only.)",
  },
  {
    id: "sommer-ray",
    name: "Sommer Ray",
    aliases: ["sommer ray", "sommer"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American glamour fitness influencer (SFW). Female, ~1.73m, athletic, celebrated glutes. Brown hair, brown eyes. Fitness lifestyle. (SFW output only.)",
  },
  {
    id: "abby-rao",
    name: "Abby Rao",
    aliases: ["abby rao"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Female, ~1.65m, slim, tattoos. Brown hair, brown eyes. Alternative look. (SFW output only.)",
  },
  {
    id: "katie-sigmond",
    name: "Katie Sigmond",
    aliases: ["katie sigmond"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Female, ~1.68m, athletic. Brown hair, brown eyes. Glamorous golfer aesthetic. (SFW output only.)",
  },
  {
    id: "hannah-owo",
    name: "Hannah Owo",
    aliases: ["hannah owo"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Female, ~1.62m, slim. Brown hair, brown eyes. E-girl style. (SFW output only.)",
  },
  {
    id: "sarati",
    name: "Sarati",
    aliases: ["sarati"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Female, ~1.67m, normal. Brown hair, brown eyes. (SFW output only.)",
  },
  {
    id: "kinsey-wolanski",
    name: "Kinsey Wolanski",
    aliases: ["kinsey wolanski"],
    gender: "female",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American model and content creator (SFW). Female, ~1.70m, slim. Blonde hair, blue eyes. Model look. (SFW output only.)",
  },
  {
    id: "jack-doherty",
    name: "Jack Doherty",
    aliases: ["jack doherty"],
    gender: "male",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American YouTuber. Male, ~1.75m, slim, young. Brown hair, brown eyes. Casual American.",
  },
  {
    id: "jason-luv",
    name: "Jason Luv",
    aliases: ["jason luv"],
    gender: "male",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American content creator (SFW). Male, ~1.88m, very muscular, numerous tattoos. Beard. Bodybuilder street. (SFW output only.)",
  },
  {
    id: "bryce-hall",
    name: "Bryce Hall",
    aliases: ["bryce hall"],
    gender: "male",
    category: "int_adult",
    nationality: "us",
    visual_description:
      "American TikToker (SFW). Male, ~1.83m, slim, tattoos. Brown hair, brown eyes. TikTok influencer. (SFW output only.)",
  },
  {
    id: "harry-jowsey",
    name: "Harry Jowsey",
    aliases: ["harry jowsey"],
    gender: "male",
    category: "int_adult",
    nationality: "au",
    visual_description:
      "Australian Too Hot To Handle star (SFW). Male, ~1.90m, muscular. Brown hair, brown eyes, tattoos. Playboy Australian look. (SFW output only.)",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNATIONAUX — YOUTUBE / TIKTOK
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "mrbeast",
    name: "MrBeast",
    aliases: ["mr beast", "jimmy donaldson"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American philanthropist YouTuber (Jimmy Donaldson). Male, ~1.88m, tall slim. Medium-long brown hair, brown eyes, angular face. Wide forced smile. Casual: t-shirt, jeans.",
  },
  {
    id: "pewdiepie",
    name: "PewDiePie",
    aliases: ["pewdiepie", "felix kjellberg"],
    gender: "male",
    category: "int_youtube",
    nationality: "se",
    visual_description:
      "Swedish gaming and humor YouTuber (Felix Kjellberg). Male, ~1.80m, slim. Brown hair, blue eyes, several-day beard. Casual Scandinavian: sweatshirt, jogging.",
  },
  {
    id: "charli-damelio",
    name: "Charli D'Amelio",
    aliases: ["charli damelio", "charli"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American TikTok dance creator. Female, ~1.70m, slim. Brown hair, brown eyes, long hair. Teenage: leggings, crop top. Pretty neutral face.",
  },
  {
    id: "khaby-lame",
    name: "Khaby Lame",
    aliases: ["khaby lame", "khaby"],
    gender: "male",
    category: "int_tiktok",
    nationality: "it",
    visual_description:
      "Senegalese-Italian silent-humor TikTok creator. Male, ~1.85m, slim. Black, brown eyes, clean-shaved head. Simple iconic: white t-shirt, jeans. Very expressive deadpan face.",
  },
  {
    id: "addison-rae",
    name: "Addison Rae",
    aliases: ["addison rae", "addison"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American TikTok dance and music creator. Female, ~1.68m, slim. Brown hair, brown eyes, long hair. American glamour: short dress, heels.",
  },
  {
    id: "logan-paul",
    name: "Logan Paul",
    aliases: ["logan paul", "logan"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTuber and boxer. Male, ~1.83m, muscular with tattoos. Brown hair, brown eyes. Show-biz: flashy tracksuit, gold chain.",
  },
  {
    id: "jake-paul",
    name: "Jake Paul",
    aliases: ["jake paul", "jake"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American boxer and YouTuber. Male, ~1.85m, muscular with tattoos. Brown hair, brown eyes. Baggy streetwear.",
  },
  {
    id: "ksi",
    name: "KSI",
    aliases: ["jj olatunji", "jj"],
    gender: "male",
    category: "int_youtube",
    nationality: "uk",
    visual_description:
      "British-Nigerian YouTuber and rapper (JJ Olatunji). Male, ~1.83m, stocky but muscular. Black, brown eyes. Streetwear: bandana, oversize sweatshirt.",
  },
  {
    id: "emma-chamberlain",
    name: "Emma Chamberlain",
    aliases: ["emma chamberlain", "emma"],
    gender: "female",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American vlogger. Female, ~1.68m, slim. Brown hair, brown eyes, mid-length. Vintage: wide trousers, small cropped tops. Stylishly tired face.",
  },
  {
    id: "bella-poarch",
    name: "Bella Poarch",
    aliases: ["bella poarch", "bella"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "Filipino-American TikTok creator. Female, ~1.60m, petite, tattoos. Filipino features, brown eyes. E-girl: colorful style, tights.",
  },
  {
    id: "zach-king",
    name: "Zach King",
    aliases: ["zach king"],
    gender: "male",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American digital illusionist and TikToker. Male, ~1.75m, normal. Brown hair, brown eyes. Casual: shirt, jeans.",
  },
  {
    id: "brent-rivera",
    name: "Brent Rivera",
    aliases: ["brent rivera"],
    gender: "male",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American vlogger and TikToker. Male, ~1.80m, muscular, light beard. Brown hair, brown eyes. Californian: white t-shirt.",
  },
  {
    id: "lele-pons",
    name: "Lele Pons",
    aliases: ["lele pons"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "Venezuelan-American creator. Female, ~1.68m, slim, tattoos. Brown hair, brown eyes. Latina glam.",
  },
  {
    id: "markiplier",
    name: "Markiplier",
    aliases: ["mark fischbach"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American gaming YouTuber (Mark Fischbach). Male, ~1.78m, normal. Brown hair, brown eyes, beard. Casual hooded sweatshirt.",
  },
  {
    id: "ninja",
    name: "Ninja",
    aliases: ["tyler blevins"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American Fortnite streamer (Tyler Blevins). Male, ~1.80m, slim. Blonde hair often dyed vibrant colors (signature blue), blue eyes. Street casual.",
  },
  {
    id: "pokimane",
    name: "Pokimane",
    aliases: ["imane anys", "poki"],
    gender: "female",
    category: "int_gaming",
    nationality: "ca",
    visual_description:
      "Moroccan-Canadian streamer (Imane Anys). Female, ~1.62m, slim. Brown long hair, brown eyes, North African features. Cute casual: pink sweater.",
  },
  {
    id: "kai-cenat",
    name: "Kai Cenat",
    aliases: ["kai cenat"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer. Male, ~1.78m, normal. Black, brown eyes, shaved head. Streetwear: big sneakers, cap. Very energetic expressive face.",
  },
  {
    id: "ishowspeed",
    name: "IShowSpeed",
    aliases: ["speed", "darren watkins"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American gaming streamer (Darren Watkins Jr.). Male, ~1.78m, slim. Black, brown eyes, braided hair. Flashy tracksuit. Extremely energetic.",
  },
  {
    id: "dream",
    name: "Dream",
    aliases: ["clay dream", "dreamwastaken"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American gaming YouTuber. Male, ~1.87m, tall slim. Light brown hair, light skin. Signature white smiley-face mask in older content; now shows face openly.",
  },
  {
    id: "mkbhd",
    name: "MKBHD",
    aliases: ["marques brownlee", "marques"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American tech YouTuber Marques Brownlee. Male, ~1.85m, slim. Black, brown eyes, clean-shaved. Smart-casual: polo shirt, quality sneakers.",
  },
  {
    id: "casey-neistat",
    name: "Casey Neistat",
    aliases: ["casey neistat"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American filmmaker and vlogger. Male, ~1.78m, normal. Blonde hair, blue eyes, beard. New York: always wears sunglasses, motorcycle jacket.",
  },
  {
    id: "david-dobrik",
    name: "David Dobrik",
    aliases: ["david dobrik"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "Slovak-American vlogger. Male, ~1.75m, slim. Brown hair, brown eyes. Young casual: sweatshirt, jeans.",
  },
  {
    id: "ryan-trahan",
    name: "Ryan Trahan",
    aliases: ["ryan trahan"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American challenge YouTuber. Male, ~1.78m, slim, young. Brown hair, brown eyes. Casual everyday.",
  },
  {
    id: "airrack",
    name: "Airrack",
    aliases: ["airrack"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American stunt YouTuber. Male, ~1.80m, normal. Brown hair, brown eyes. Casual American.",
  },
  {
    id: "dhar-mann",
    name: "Dhar Mann",
    aliases: ["dharr mann"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "Indian-American moral video creator. Male, ~1.75m, normal. Brown hair, brown eyes, beard. Business-casual.",
  },
  {
    id: "dude-perfect",
    name: "Dude Perfect",
    aliases: ["dude perfect"],
    gender: "group",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American trick-shot stunt team (5 members). Five tall athletic American men, sporty styles.",
  },
  {
    id: "sidemen",
    name: "Sidemen",
    aliases: ["sidemen group"],
    gender: "group",
    category: "int_youtube",
    nationality: "uk",
    visual_description:
      "British YouTube group of 7. Includes KSI (dark skin), various physiques. Young British men, streetwear UK style.",
  },
  {
    id: "veritasium",
    name: "Veritasium",
    aliases: ["derek muller"],
    gender: "male",
    category: "int_youtube",
    nationality: "ca",
    visual_description:
      "Australian-Canadian science YouTuber (Derek Muller). Male, ~1.83m, slim. Blonde hair, blue eyes. Simple casual.",
  },
  {
    id: "smarter-every-day",
    name: "SmarterEveryDay",
    aliases: ["smarter every day", "destin sandlin"],
    gender: "male",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American science YouTuber (Destin Sandlin). Male, ~1.78m, normal. Brown hair, brown eyes, beard. Engineer look.",
  },
  {
    id: "linus-tech-tips",
    name: "Linus Tech Tips",
    aliases: ["linus", "ltt", "linus sebastian"],
    gender: "male",
    category: "int_youtube",
    nationality: "ca",
    visual_description:
      "Canadian tech YouTuber (Linus Sebastian). Male, ~1.78m, normal. Brown hair, brown eyes, beard. Geek casual.",
  },
  {
    id: "the-try-guys",
    name: "The Try Guys",
    aliases: ["try guys"],
    gender: "group",
    category: "int_youtube",
    nationality: "us",
    visual_description:
      "American YouTube test group (4 diverse men). Eugene Lee Yang (Korean-American), Keith Habersberger (tall), Zach Kornfeld (shorter), and former member Ned Fulmer. Diverse physiques.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNATIONAUX — BEAUTÉ / MODE / ICÔNES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "huda-kattan",
    name: "Huda Kattan",
    aliases: ["huda beauty", "huda kattan"],
    gender: "female",
    category: "int_beauty",
    nationality: "us",
    visual_description:
      "Iraqi-American beauty mogul. Female, ~1.65m, slim. Long brown hair, brown eyes. Luxury glamorous: blazer, heels. Middle Eastern features.",
  },
  {
    id: "kim-kardashian",
    name: "Kim Kardashian",
    aliases: ["kim k", "kim kardashian west"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American media personality. Female, ~1.59m, iconic hourglass (strong hips, narrow waist). Brown hair, brown eyes. Hyper-glamorous luxury look.",
  },
  {
    id: "kylie-jenner",
    name: "Kylie Jenner",
    aliases: ["kylie jenner", "kylie"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American beauty mogul. Female, ~1.68m, generous curves, surgically augmented full lips. Brown hair, brown eyes. Luxury streetwear.",
  },
  {
    id: "kendall-jenner",
    name: "Kendall Jenner",
    aliases: ["kendall jenner", "kendall"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American supermodel. Female, ~1.79m, very slim and long. Brown hair, brown eyes. Top-model: runway or casual chic.",
  },
  {
    id: "hailey-bieber",
    name: "Hailey Bieber",
    aliases: ["hailey baldwin", "hailey bieber"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American model. Female, ~1.71m, slim. Brown hair, brown eyes. Model streetwear style.",
  },
  {
    id: "selena-gomez",
    name: "Selena Gomez",
    aliases: ["selena gomez", "selena"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American singer and actress. Female, ~1.65m, normal. Brown hair, brown eyes, round face. Elegant yet relaxed.",
  },
  {
    id: "beyonce",
    name: "Beyoncé",
    aliases: ["beyonce", "queen bey"],
    gender: "female",
    category: "int_celebrity",
    nationality: "us",
    visual_description:
      "American global superstar. Female, ~1.69m, athletic with strong curves. Black, brown eyes. Stage: sequins, power suits. Warm brown skin, often long blonde extensions.",
  },
  {
    id: "nikkie-tutorials",
    name: "NikkieTutorials",
    aliases: ["nikkie de jager", "nikkie tutorials"],
    gender: "female",
    category: "int_beauty",
    nationality: "nl",
    visual_description:
      "Dutch beauty YouTuber Nikkie de Jager. Female, ~1.88m, very tall, blonde hair, blue eyes, transgender woman. Always dramatically glam: sequins, heels, bold makeup.",
  },
  {
    id: "james-charles",
    name: "James Charles",
    aliases: ["james charles"],
    gender: "male",
    category: "int_beauty",
    nationality: "us",
    visual_description:
      "American beauty YouTuber. Male, ~1.70m, slim. Brown hair, brown eyes. Androgynous. Signature bold flashy artistic makeup.",
  },
  {
    id: "bretman-rock",
    name: "Bretman Rock",
    aliases: ["bretman rock"],
    gender: "male",
    category: "int_beauty",
    nationality: "us",
    visual_description:
      "Filipino-American beauty influencer. Male, ~1.70m, normal. Filipino features, brown eyes, tattoos. Eccentric extravagant look.",
  },
  {
    id: "chiara-ferragni",
    name: "Chiara Ferragni",
    aliases: ["chiara ferragni"],
    gender: "female",
    category: "int_beauty",
    nationality: "it",
    visual_description:
      "Italian fashion influencer. Female, ~1.77m, slim. Blonde hair, blue eyes. Italian luxury high-fashion.",
  },
  {
    id: "dixie-damelio",
    name: "Dixie D'Amelio",
    aliases: ["dixie damelio", "dixie"],
    gender: "female",
    category: "int_tiktok",
    nationality: "us",
    visual_description:
      "American TikToker and singer, sister of Charli. Female, ~1.68m, slim. Brown hair, brown eyes. Casual American.",
  },
  {
    id: "michelle-phan",
    name: "Michelle Phan",
    aliases: ["michelle phan"],
    gender: "female",
    category: "int_beauty",
    nationality: "us",
    visual_description:
      "Vietnamese-American beauty YouTuber. Female, ~1.57m, slim. Dark black hair, dark eyes. Light East Asian fair skin. Elegant beauty style.",
  },
  {
    id: "lilly-singh",
    name: "Lilly Singh",
    aliases: ["iisuperwomanii", "superwoman"],
    gender: "female",
    category: "int_youtube",
    nationality: "ca",
    visual_description:
      "Canadian-Indian YouTuber. Female, ~1.67m, athletic slim. Long dark hair, brown eyes. Warm brown skin (Punjabi-Indian). Bold colorful style.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNATIONAUX — ATHLÈTES
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cristiano-ronaldo",
    name: "Cristiano Ronaldo",
    aliases: ["ronaldo", "cr7"],
    gender: "male",
    category: "int_athlete",
    nationality: "pt",
    reference_image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/440px-Cristiano_Ronaldo_2018.jpg",
    visual_description:
      "Portuguese soccer superstar. Male, ~1.87m, extremely lean and muscular. Brown hair, brown eyes, chiseled sharp jaw. Sharp fade haircut. Sporty-chic or tailored suit. Very defined muscular body.",
  },
  {
    id: "lionel-messi",
    name: "Lionel Messi",
    aliases: ["messi", "leo messi"],
    gender: "male",
    category: "int_athlete",
    nationality: "ar",
    reference_image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Messi_vs_Nigeria_2018.jpg/440px-Messi_vs_Nigeria_2018.jpg",
    visual_description:
      "Argentine soccer legend. Male, ~1.70m, short and stocky. Brown hair and beard, brown eyes. Olive/medium skin. Simple: t-shirt, jeans. Very recognizable dark beard.",
  },
  {
    id: "neymar",
    name: "Neymar",
    aliases: ["neymar jr"],
    gender: "male",
    category: "int_athlete",
    nationality: "br",
    reference_image_url:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Neymar_vs_Croatia_%28cropped%29.jpg/440px-Neymar_vs_Croatia_%28cropped%29.jpg",
    visual_description:
      "Brazilian soccer star Neymar Jr. Male, ~1.75m, slim with tattoos. Brown hair (often unique styles: mohawk, braids, bleached). Brown eyes. Fashion-forward: cap, jewelry.",
  },
  {
    id: "drake",
    name: "Drake",
    aliases: ["aubrey graham", "champagnepapi"],
    gender: "male",
    category: "int_celebrity",
    nationality: "ca",
    visual_description:
      "Canadian rapper Drake (Aubrey Graham). Male, ~1.82m, normal. Mixed race, brown eyes, beard. Luxury streetwear: Canada Goose, Nike. Fade haircut.",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNATIONAUX — GAMING / STREAMING
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "shroud",
    name: "Shroud",
    aliases: ["michael grzesiek"],
    gender: "male",
    category: "int_gaming",
    nationality: "ca",
    visual_description:
      "Polish-Canadian FPS streamer. Male, ~1.83m, normal. Brown hair, brown eyes, beard. Casual everyday.",
  },
  {
    id: "tfue",
    name: "Tfue",
    aliases: ["turner tenney"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American Fortnite streamer. Male, ~1.78m, slim, tattoos. Blonde hair, blue eyes. Street casual.",
  },
  {
    id: "timthetatman",
    name: "TimTheTatman",
    aliases: ["tim thetatman"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer. Male, ~1.90m, large heavyset build, beard, glasses. Casual everyday.",
  },
  {
    id: "valkyrae",
    name: "Valkyrae",
    aliases: ["rachell hofstetter"],
    gender: "female",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "Filipino-American streamer. Female, ~1.63m, slim. Black hair, brown eyes. E-girl look.",
  },
  {
    id: "sykkuno",
    name: "Sykkuno",
    aliases: ["thomas lu"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "Asian-American streamer. Male, ~1.70m, very slim. Black hair, brown eyes. Shy cute style.",
  },
  {
    id: "xqc",
    name: "xQc",
    aliases: ["felix lengyel", "xqcow"],
    gender: "male",
    category: "int_gaming",
    nationality: "ca",
    visual_description:
      "French-Canadian streamer. Male, ~1.88m, normal. Brown hair, brown eyes, beard. Very casual.",
  },
  {
    id: "dr-disrespect",
    name: "Dr Disrespect",
    aliases: ["dr disrespect"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer persona. Male, ~1.96m, very tall. Signature: large black mullet wig, thick black mustache, dark wraparound sunglasses, camo or black tactical jacket. The champion persona.",
  },
  {
    id: "ludwig",
    name: "Ludwig",
    aliases: ["ludwig ahgren"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American streamer (Ludwig Ahgren). Male, ~1.85m, slim. Brown hair, brown eyes, beard. Casual cozy.",
  },
  {
    id: "asmongold",
    name: "Asmongold",
    aliases: ["zack asmongold"],
    gender: "male",
    category: "int_gaming",
    nationality: "us",
    visual_description:
      "American WoW streamer. Male, ~1.75m, normal. Brown hair (sometimes unkempt medium-length), brown eyes. Minimal geek casual.",
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
    (c) => `CELEBRITY VISUAL REFERENCE — ${c.name.toUpperCase()}: ${c.visual_description}`,
  );
  return entries.join(" | ") + " ";
}
