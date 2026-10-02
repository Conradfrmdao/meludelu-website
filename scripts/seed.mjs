// Seeds categories, sample products, store settings and the owner login.
// Safe to re-run: existing rows (matched by slug / sku / email / key) are left alone.
// Usage: npm run db:seed
import bcrypt from "bcryptjs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const img = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

const departments = [
  {
    slug: "women",
    name: "Women",
    description: "Linen, cotton and soft wool in colours that work with what you already own.",
    children: [
      ["dresses", "Dresses"],
      ["tops", "Tops & shirts"],
      ["knitwear", "Knitwear"],
      ["outerwear", "Coats & jackets"],
      ["sets", "Sets"],
    ],
  },
  {
    slug: "baby",
    name: "Baby",
    description: "Gentle fabrics and easy poppers, from newborn to two years.",
    children: [
      ["rompers", "Bodysuits & rompers"],
      ["sleepwear", "Sleepwear"],
      ["knitwear", "Knitwear"],
      ["dresses", "Dresses"],
      ["accessories", "Hats, booties & gifts"],
    ],
  },
];

const WOMEN_SIZES = ["XS", "S", "M", "L"];
const BABY_SIZES = ["0–3M", "3–6M", "6–12M"];

// stock: number per variant for MELUDELU_STOCK, or a status for EXTERNAL_SUPPLIER.
const products = [
  {
    dept: "women", cat: "dresses", name: "Oat Linen Shift Dress", slug: "oat-linen-shift-dress",
    description: "A straight, sleeveless shift in washed linen. It sits just below the knee and has deep side pockets.",
    details: "100% linen\nMidweight, garment washed for softness\nSide pockets\nModel wears size S",
    care: "Machine wash cold. Line dry. Warm iron while slightly damp.",
    supplier: "MELUDELU_STOCK", price: 145000, cost: 62000, sizes: WOMEN_SIZES, color: ["Oat", "#D8CBB8"],
    stock: [2, 5, 4, 1], featured: true, isNew: true,
    images: [["1747396206869-75ea57b325ce", "Woman in an oat linen shift dress against a pale wall"], ["1578747522302-b987fbec4465", "Close view of the linen weave and neckline"]],
  },
  {
    dept: "women", cat: "dresses", name: "Ivory Belted Linen Dress", slug: "ivory-belted-linen-dress",
    description: "A short-sleeved linen dress with a soft rope belt. Light enough for hot afternoons in town.",
    details: "Linen blend\nRemovable braided belt\nRelaxed fit",
    care: "Hand wash cold. Dry flat in the shade.",
    supplier: "EXTERNAL_SUPPLIER", shipping: "international", price: 128000, compareAt: 155000, cost: 48000,
    sizes: ["S", "M", "L"], color: ["Ivory", "#F1ECE2"], stock: "ships_from_china", pricing: ["markup", 2.6],
    images: [["1789110520302-3df8ce0410f0", "Ivory linen dress with a braided rope belt"]],
  },
  {
    dept: "women", cat: "dresses", name: "Terracotta Shirt Dress", slug: "terracotta-shirt-dress",
    description: "A button-through shirt dress in a warm terracotta cotton, with a tie waist you can wear loose or cinched.",
    details: "100% cotton poplin\nButton front, tie waist\nShort sleeves",
    care: "Machine wash 30°C with similar colours.",
    supplier: "MELUDELU_STOCK", price: 135000, cost: 56000, sizes: ["S", "M", "L"], color: ["Terracotta", "#C0634A"],
    stock: [3, 4, 2], isNew: true,
    images: [["1789110853872-f416085557fa", "Terracotta button-through shirt dress with tie waist"], ["1789110853833-bc1a883da2d6", "Back view of the terracotta shirt dress"]],
  },
  {
    dept: "women", cat: "dresses", name: "Sage Strap Midi Dress", slug: "sage-strap-midi-dress",
    description: "A fluid midi dress on fine straps, gathered at the bust. Pairs well with a cardigan for the evening.",
    details: "Viscose crepe\nAdjustable straps\nFully lined",
    care: "Hand wash cold.",
    supplier: "EXTERNAL_SUPPLIER", shipping: "international", price: 118000, cost: 45000,
    sizes: ["S", "M", "L"], color: ["Sage", "#B9C3B0"], stock: "available_to_order", isNew: true,
    images: [["1789110519607-6176d668fb72", "Sage green midi dress with thin straps"]],
  },
  {
    dept: "women", cat: "dresses", name: "Sand Tiered Sundress", slug: "sand-tiered-sundress",
    description: "Three soft tiers, an off-the-shoulder neckline and plenty of room to move.",
    details: "Cotton gauze\nElasticated neckline\nTiered skirt",
    care: "Machine wash cold, gentle cycle.",
    supplier: "MELUDELU_STOCK", price: 139000, compareAt: 165000, cost: 58000, sizes: ["S", "M", "L"], color: ["Sand", "#D9C6AA"],
    stock: [1, 3, 2],
    images: [["1789145508216-ade0a26d518a", "Sand coloured tiered sundress worn on a beach"]],
  },
  {
    dept: "women", cat: "dresses", name: "Natural Linen Pinafore", slug: "natural-linen-pinafore",
    description: "A sleeveless pinafore in undyed linen. Wear it alone, or over a fine knit when the evenings cool.",
    details: "100% linen\nWide armholes\nPatch pocket",
    care: "Machine wash cold. Line dry.",
    supplier: "MELUDELU_STOCK", price: 110000, cost: 44000, sizes: ["S", "M"], color: ["Natural", "#E3D9CA"],
    stock: [2, 1],
    images: [["1578747522731-9e5a179b02f7", "Undyed linen pinafore dress on a hanger"]],
  },
  {
    dept: "women", cat: "tops", name: "Ruffle Cotton Blouse", slug: "ruffle-cotton-blouse",
    description: "Crisp white cotton with a gentle ruffle at the shoulder. Tucks neatly into trousers or a skirt.",
    details: "100% cotton\nCovered buttons\nRegular fit",
    care: "Machine wash 30°C. Iron on medium.",
    supplier: "MELUDELU_STOCK", price: 85000, cost: 33000, sizes: WOMEN_SIZES, color: ["White", "#FAFAF7"],
    stock: [2, 6, 5, 3], featured: true,
    images: [["1778826971115-96584e733b84", "White ruffled cotton blouse"]],
  },
  {
    dept: "women", cat: "tops", name: "Relaxed Satin Shirt", slug: "relaxed-satin-shirt",
    description: "A loose, softly draped shirt with a low sheen. Smart enough for work, easy enough for weekends.",
    details: "Polyester satin\nDropped shoulder\nConcealed placket",
    care: "Hand wash cold. Cool iron.",
    supplier: "EXTERNAL_SUPPLIER", shipping: "international", price: 92000, cost: 34000,
    sizes: ["S", "M", "L"], color: ["Ivory", "#EFE8DC"], stock: "ships_from_china",
    images: [["1600884350802-c6d0bf14dcc6", "Woman wearing a relaxed ivory satin shirt"]],
  },
  {
    dept: "women", cat: "knitwear", name: "Open-Knit Cardigan", slug: "open-knit-cardigan",
    description: "A long cardigan in an airy open stitch. Warm enough for Kampala mornings, light enough to carry all day.",
    details: "Cotton and acrylic blend\nDropped shoulder\nNo fastening",
    care: "Hand wash cold. Dry flat.",
    supplier: "MELUDELU_STOCK", price: 120000, cost: 47000, sizes: ["S/M", "L/XL"], color: ["Cream", "#EDE4D3"],
    stock: [4, 3], featured: true,
    images: [["1588271968087-4c51abe05afc", "Cream open-knit cardigan, close up"], ["1587999882859-34b3f313df77", "Woman in a cream knit cardigan outdoors"]],
  },
  {
    dept: "women", cat: "knitwear", name: "Ribbed Crew Jumper", slug: "ribbed-crew-jumper",
    description: "A soft ribbed jumper with a slightly cropped length and wide sleeves.",
    details: "Wool blend\nRibbed throughout\nRelaxed fit",
    care: "Hand wash cold. Dry flat.",
    supplier: "EXTERNAL_SUPPLIER", shipping: "international", price: 98000, cost: 38000,
    sizes: ["S", "M", "L"], color: ["Oatmeal", "#D6CFC4"], stock: "ships_from_china",
    images: [["1574201635302-388dd92a4c3f", "Oatmeal ribbed jumper"]],
  },
  {
    dept: "women", cat: "outerwear", name: "Camel Wool-Blend Coat", slug: "camel-wool-blend-coat",
    description: "A single-breasted coat in a warm camel wool blend, cut long and straight. Made for travel and cooler months.",
    details: "60% wool, 40% polyester\nFully lined\nTwo welt pockets",
    care: "Dry clean only.",
    supplier: "MELUDELU_STOCK", price: 320000, cost: 140000, sizes: ["S", "M", "L"], color: ["Camel", "#B08A62"],
    stock: [1, 2, 1], featured: true,
    images: [
      ["1618333452884-5c8d211ed2ad", "Woman in a long camel coat on white steps"],
      ["1618244972963-dbee1a7edc95", "Camel coat worn open over a knit dress"],
      ["1618244965061-1d27b208d6e8", "Camel coat beside a dark doorway"],
    ],
  },
  {
    dept: "women", cat: "outerwear", name: "Linen Duster Coat", slug: "linen-duster-coat",
    description: "A long, unstructured linen coat that layers over dresses and trousers alike.",
    details: "100% linen\nCollarless\nDeep patch pockets",
    care: "Machine wash cold. Line dry.",
    supplier: "EXTERNAL_SUPPLIER", shipping: "international", price: 210000, cost: 80000,
    sizes: ["S/M", "L/XL"], color: ["Stone", "#CFC5B7"], stock: "available_to_order", isNew: true,
    images: [["1764298493197-a1c1cce57800", "Woman in a long stone linen duster coat and straw hat"]],
  },
  {
    dept: "women", cat: "outerwear", name: "Black Tailored Blazer", slug: "black-tailored-blazer",
    description: "A sharp single-button blazer with softly padded shoulders.",
    details: "Polyester and viscose\nSingle button\nPartly lined",
    care: "Dry clean only.",
    supplier: "MELUDELU_STOCK", price: 230000, cost: 95000, sizes: ["S", "M", "L"], color: ["Black", "#1F1D1B"],
    stock: [0, 0, 0],
    images: [["1654512697681-8434b50096dd", "Woman in a black tailored blazer and trousers"]],
  },
  {
    dept: "women", cat: "sets", name: "Ecru Trouser Suit", slug: "ecru-trouser-suit",
    description: "A relaxed blazer and wide-leg trouser in the same soft ecru. Wear them together or apart.",
    details: "Linen and viscose\nBlazer and trouser sold together\nTrousers have an elasticated back waist",
    care: "Dry clean recommended.",
    supplier: "MELUDELU_STOCK", price: 245000, cost: 105000, sizes: ["S", "M", "L"], color: ["Ecru", "#E9E1D2"],
    stock: [2, 2, 1], featured: true,
    images: [["1627130697816-4d71dbfe6a5b", "Woman in an ecru blazer and wide trousers"]],
  },
  {
    dept: "baby", cat: "rompers", name: "Organic Cotton Bodysuit", slug: "organic-cotton-bodysuit",
    description: "The everyday short-sleeved bodysuit, in soft organic cotton with poppers at the base.",
    details: "100% organic cotton\nEnvelope neck for easy dressing\nPoppers at the base",
    care: "Machine wash 40°C.",
    supplier: "MELUDELU_STOCK", price: 28000, cost: 9000, sizes: BABY_SIZES, color: ["White", "#FAFAF7"],
    stock: [8, 10, 6], featured: true,
    images: [["1622290319146-7b63df48a635", "White short-sleeved baby bodysuit laid flat"]],
  },
  {
    dept: "baby", cat: "rompers", name: "Bodysuit Trio", slug: "bodysuit-trio",
    description: "Three printed cotton bodysuits for everyday changes. Softer with every wash.",
    details: "Pack of three\n100% cotton\nEnvelope neck, poppers at the base",
    care: "Machine wash 40°C.",
    supplier: "MELUDELU_STOCK", price: 72000, cost: 26000, sizes: BABY_SIZES, color: ["Mixed prints", "#EADBD3"],
    stock: [4, 5, 3],
    images: [["1622290291720-ac961c43ee30", "Three printed baby bodysuits"]],
  },
  {
    dept: "baby", cat: "rompers", name: "Bear-Ear Pram Suit", slug: "bear-ear-pram-suit",
    description: "A cosy all-in-one with a zip front and a hood with small ears. Good for cool mornings and evenings.",
    details: "Plush fleece\nTwo-way zip\nFold-over cuffs on smaller sizes",
    care: "Machine wash 30°C. Do not tumble dry.",
    supplier: "EXTERNAL_SUPPLIER", shipping: "international", price: 95000, cost: 34000,
    sizes: BABY_SIZES, color: ["Cocoa", "#7B6A5E"], stock: "ships_from_china", featured: true,
    images: [["1522771930-78848d9293e8", "Baby in a cocoa pram suit with bear ears"]],
  },
  {
    dept: "baby", cat: "knitwear", name: "Button Knit Romper", slug: "button-knit-romper",
    description: "A fine-knit romper with wooden-look buttons down the front.",
    details: "100% cotton knit\nButton front\nPoppers at the leg",
    care: "Hand wash cold. Dry flat.",
    supplier: "MELUDELU_STOCK", price: 68000, cost: 25000, sizes: BABY_SIZES, color: ["Heather grey", "#B5B2AD"],
    stock: [3, 4, 2], featured: true, isNew: true,
    images: [["1617331140180-e8262094733a", "Smiling baby in a grey button knit romper"]],
  },
  {
    dept: "baby", cat: "knitwear", name: "Pointelle Knit Cardigan", slug: "pointelle-knit-cardigan",
    description: "A delicate pointelle cardigan for newborns, soft against new skin.",
    details: "Cotton knit\nSmall button fastening\nRibbed cuffs",
    care: "Hand wash cold. Dry flat.",
    supplier: "MELUDELU_STOCK", price: 62000, cost: 22000, sizes: ["Newborn", "0–3M", "3–6M"], color: ["Cream", "#EDE4D3"],
    stock: [3, 2, 2], isNew: true,
    images: [["1773243086631-962baefccd8a", "Newborn sleeping in a cream pointelle cardigan"]],
  },
  {
    dept: "baby", cat: "knitwear", name: "Olive Knit Set", slug: "olive-knit-set",
    description: "A matching knit jumper and trouser with scalloped edges.",
    details: "Cotton knit\nTwo pieces\nElasticated waist",
    care: "Hand wash cold. Dry flat.",
    supplier: "EXTERNAL_SUPPLIER", shipping: "international", price: 74000, cost: 27000,
    sizes: BABY_SIZES, color: ["Olive", "#6F7552"], stock: "available_to_order",
    images: [["1739668415674-7b775cfce9ca", "Baby in an olive knit jumper and trousers"]],
  },
  {
    dept: "baby", cat: "sleepwear", name: "Fleece Sleepsuit", slug: "fleece-sleepsuit",
    description: "A soft footed sleepsuit with poppers all the way down for quick night changes.",
    details: "Brushed cotton fleece\nPoppers from neck to foot\nFooted",
    care: "Machine wash 40°C.",
    supplier: "MELUDELU_STOCK", price: 45000, cost: 16000, sizes: BABY_SIZES, color: ["Sky", "#BCD3E6"],
    stock: [5, 4, 4],
    images: [["1582212742235-a2500f31cb39", "Baby asleep in a pale blue sleepsuit"]],
  },
  {
    dept: "baby", cat: "sleepwear", name: "Heart Print Pyjamas", slug: "heart-print-pyjamas",
    description: "A two-piece cotton pyjama set scattered with small hearts.",
    details: "100% cotton\nTwo pieces\nSoft elasticated waist",
    care: "Machine wash 40°C.",
    supplier: "MELUDELU_STOCK", price: 52000, cost: 18000, sizes: ["6–12M", "12–18M", "18–24M"], color: ["Heart print", "#F4EEEA"],
    stock: [3, 3, 2], isNew: true,
    images: [["1622205797643-3045566a56e8", "Baby sitting in heart print pyjamas"]],
  },
  {
    dept: "baby", cat: "dresses", name: "Broderie Party Dress", slug: "broderie-party-dress",
    description: "A white broderie anglaise dress for christenings, birthdays and family photos.",
    details: "Cotton broderie\nCotton lining\nButtons at the back",
    care: "Hand wash cold.",
    supplier: "EXTERNAL_SUPPLIER", shipping: "international", price: 88000, compareAt: 105000, cost: 32000,
    sizes: ["6–12M", "12–18M", "18–24M"], color: ["White", "#FAFAF7"], stock: "ships_from_china",
    images: [["1684244160171-97f5dac39204", "White broderie baby dress hanging by a window"]],
  },
  {
    dept: "baby", cat: "accessories", name: "Knit Booties", slug: "knit-booties",
    description: "Soft knitted booties that stay on little feet.",
    details: "Cotton knit\nRibbed cuff",
    care: "Hand wash cold.",
    supplier: "MELUDELU_STOCK", price: 32000, cost: 10000, sizes: ["0–6M", "6–12M"], color: ["Blush", "#E8CFC6"],
    stock: [6, 4],
    images: [["1617204360640-d4a2508c0243", "Baby feet in soft knitted booties"]],
  },
  {
    dept: "baby", cat: "accessories", name: "Cable Knit Beanie", slug: "cable-knit-beanie",
    description: "A warm, stretchy beanie for cooler days and air-conditioned rooms.",
    details: "Acrylic and wool blend\nOne size fits 0–12 months",
    care: "Hand wash cold.",
    supplier: "MELUDELU_STOCK", price: 30000, cost: 9000, sizes: ["One size"], color: ["Moss", "#7F7A66"],
    stock: [7],
    images: [["1601628570754-f602c5930dd5", "Baby wrapped up in a moss knit beanie"]],
  },
  {
    dept: "baby", cat: "accessories", name: "Newborn Gift Box", slug: "newborn-gift-box",
    description: "Bodysuits, a swaddle, a soft toy and a card, packed in a keepsake box. Tell us the name for the card in your order notes.",
    details: "Two bodysuits (0–3M)\nOne muslin swaddle\nOne soft toy\nHandwritten card",
    care: "See each item.",
    supplier: "MELUDELU_STOCK", price: 185000, cost: 70000, sizes: [null], color: [null, null],
    stock: [3], featured: true,
    images: [["1635874714425-c342060a4c58", "Newborn gift box with bodysuits, swaddle and soft toy"]],
  },
];

const settings = {
  payments: {
    mtn: {
      enabled: true,
      label: "MTN Mobile Money",
      merchantCode: "",
      merchantName: "",
      ussdTemplate: "*165*3#",
    },
    airtel: {
      enabled: true,
      label: "Airtel Money",
      merchantCode: "",
      merchantName: "",
      ussdTemplate: "*185*9#",
    },
  },
  delivery: {
    zones: [
      { id: "kampala", label: "Kampala", fee: 10000, eta: "1–2 working days" },
      { id: "wakiso", label: "Wakiso & Entebbe", fee: 15000, eta: "2–3 working days" },
      { id: "upcountry", label: "Rest of Uganda", fee: 25000, eta: "2–5 working days" },
    ],
    freeOver: null,
    internationalLeadTime: "14–21 days",
  },
  contact: {
    whatsapp: "",
    phone: "",
    email: "",
    city: "Kampala",
  },
};

function slugSku(slug, size, color) {
  const base = slug.split("-").map((w) => w.slice(0, 3)).join("").toUpperCase().slice(0, 10);
  const s = (size ?? "OS").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const c = (color ?? "").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  return [base, c, s].filter(Boolean).join("-");
}

// Everything is collected into one SQL script and sent in a single round trip,
// because the database is far away and hundreds of small queries are slow.
const q = (v) => (v === null || v === undefined ? "null" : client.escapeLiteral(String(v)));
const statements = [];
const uuid = () => crypto.randomUUID();

const existingCats = new Map(
  (await client.query("select c.id, c.slug, p.slug as parent from categories c left join categories p on p.id = c.parent_id")).rows.map(
    (r) => [r.parent ? `${r.parent}/${r.slug}` : r.slug, r.id],
  ),
);
const existingSlugs = new Set((await client.query("select slug from products")).rows.map((r) => r.slug));

const catIds = {};
for (const [i, dept] of departments.entries()) {
  let parentId = existingCats.get(dept.slug);
  if (!parentId) {
    parentId = uuid();
    statements.push(
      `insert into categories (id, name, slug, description, sort_order) values (${q(parentId)}, ${q(dept.name)}, ${q(dept.slug)}, ${q(dept.description)}, ${i});`,
    );
  }
  for (const [j, [slug, name]] of dept.children.entries()) {
    let id = existingCats.get(`${dept.slug}/${slug}`);
    if (!id) {
      id = uuid();
      statements.push(
        `insert into categories (id, parent_id, name, slug, sort_order) values (${q(id)}, ${q(parentId)}, ${q(name)}, ${q(slug)}, ${j});`,
      );
    }
    catIds[`${dept.slug}/${slug}`] = id;
  }
}

statements.push(
  `insert into suppliers (name, contact, notes) values ('Guangzhou partner (sample)', 'Add contact details', 'Sample supplier created by the seed script') on conflict (name) do nothing;`,
);
const supplierRef = "(select id from suppliers where name = 'Guangzhou partner (sample)')";

for (const [index, p] of products.entries()) {
  if (existingSlugs.has(p.slug)) continue;
  const external = p.supplier === "EXTERNAL_SUPPLIER";
  const [mode, mult] = p.pricing ?? ["manual", null];
  // Spread creation dates so "newest" sorting has something to sort.
  const createdAt = new Date(Date.now() - (products.length - index) * 36e5 * 20).toISOString();
  const productId = uuid();
  statements.push(
    `insert into products (id, category_id, name, slug, description, details, care, supplier_type, supplier_id,
       shipping_type, pricing_mode, markup_multiplier, status, is_featured, is_new, created_at)
     values (${q(productId)}, ${q(catIds[`${p.dept}/${p.cat}`])}, ${q(p.name)}, ${q(p.slug)}, ${q(p.description)}, ${q(p.details)},
       ${q(p.care)}, ${q(p.supplier)}, ${external ? supplierRef : "null"}, ${q(p.shipping ?? "local")}, ${q(mode)}, ${q(mult)},
       'active', ${!!p.featured}, ${!!p.isNew}, ${q(createdAt)});`,
  );
  for (const [i, [id, alt]] of p.images.entries()) {
    statements.push(
      `insert into product_images (product_id, url, alt, sort_order) values (${q(productId)}, ${q(img(id))}, ${q(alt)}, ${i});`,
    );
  }
  for (const [i, size] of p.sizes.entries()) {
    const [colorName, colorHex] = p.color;
    const variantId = uuid();
    statements.push(
      `insert into product_variants (id, product_id, sku, size, color_name, color_hex, supplier_cost, retail_price, compare_at_price, stock_status, sort_order)
       values (${q(variantId)}, ${q(productId)}, ${q(slugSku(p.slug, size, colorName))}, ${q(size)}, ${q(colorName)}, ${q(colorHex)},
         ${p.cost}, ${p.price}, ${p.compareAt ?? "null"}, ${q(external ? p.stock : "in_stock")}, ${i});`,
    );
    if (!external) {
      const qty = p.stock[i] ?? 0;
      statements.push(`insert into inventory (variant_id, quantity_on_hand) values (${q(variantId)}, ${qty});`);
      if (qty > 0) {
        statements.push(
          `insert into inventory_movements (variant_id, change, reason, actor, note) values (${q(variantId)}, ${qty}, 'restock', 'seed', 'Opening stock');`,
        );
      }
    }
  }
}

for (const [key, value] of Object.entries(settings)) {
  statements.push(
    `insert into store_settings (key, value) values (${q(key)}, ${q(JSON.stringify(value))}::jsonb) on conflict (key) do nothing;`,
  );
}

const email = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_OWNER_PASSWORD;
if (email && password) {
  const hash = await bcrypt.hash(password, 12);
  statements.push(
    `insert into admin_users (email, name, password_hash, role) values (${q(email)}, 'Owner', ${q(hash)}, 'owner') on conflict (email) do nothing;`,
  );
} else {
  console.log("SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD not set: no owner login created.");
}

try {
  await client.query(["begin;", ...statements, "commit;"].join("\n"));
  console.log(`Seed complete (${statements.length} statements).`);
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error(error);
  process.exitCode = 1;
}

await client.end();
