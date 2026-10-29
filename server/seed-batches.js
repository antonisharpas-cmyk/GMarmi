// Content batches added after the first seed. Each batch runs once per database
// (tracked in settings.seed.batches), so it works on a fresh database and on one already in use.
import { q, one } from './db.js';

async function media(name, alt) {
  const r = await one(
    `INSERT INTO media (filename, alt_en, alt_el, url, url_sm, tags) VALUES ($1,$2,$2,$3,$4,'seed') RETURNING id`,
    [name + '.webp', alt, `/seed/${name}.webp`, `/seed/${name}-sm.webp`]
  );
  return r.id;
}
const idOf = async (type, slug) => (await one(`SELECT id FROM entries WHERE type=$1 AND slug=$2`, [type, slug]))?.id ?? null;
async function nextSort(type) { return (await one(`SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM entries WHERE type=$1`, [type])).n; }
async function entry(type, slug, data, images, extra = {}) {
  if (await idOf(type, slug)) return idOf(type, slug);
  const r = await one(
    `INSERT INTO entries (type, slug, sort_order, data, images, cover_id, published, featured) VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7) RETURNING id`,
    [type, slug, await nextSort(type), JSON.stringify(data), JSON.stringify(images), images[0] ?? null, !!extra.featured]
  );
  return r.id;
}

// Batch 2: Facebook posts with Real Matt, Stone Lab and Infinito 2.0 materials
async function batch2() {
  const M = {};
  const list = {
    'ebur-vein-1': 'Royal Travertino Ebur Vein kitchen, island and floor',
    'ebur-vein-2': 'Royal Travertino Ebur Vein backsplash and worktop',
    'ebur-vein-swatch': 'Royal Travertino Ebur Vein slab, Real Matt',
    'real-matt': 'Real Matt finish with a velvety touch',
    'fuscus-1': 'Travertino Fuscus bathroom vanity and wall',
    'fuscus-2': 'Travertino Fuscus vanity detail',
    'fuscus-swatch': 'Stone Lab Travertino Fuscus slab, 12 mm, 163 x 324 cm',
    'sikelia-1': 'Sikelia kitchen worktop and backsplash',
    'sikelia-swatch': 'Stone Lab Sikelia slab, Full 3D Texture',
    'labradorite-1': 'Labradorite Royale feature wall in a dining room',
    'labradorite-swatch': 'Infinito 2.0 Labradorite Royale slab',
    'calacatta-paris-1': 'Calacatta Paris kitchen island and book matched wall',
    'calacatta-paris-2': 'Calacatta Paris kitchen island by an arched window',
    'calacatta-paris-swatch': 'Infinito 2.0 Calacatta Paris slab, 3D Texture',
    'tiger-1': 'Tiger backlit reception desk and wall in a lobby',
    'tiger-2': 'Tiger reception desk and feature wall',
    'tiger-swatch': 'Infinito 2.0 Tiger slab',
    'cream-diamonds-1': 'Cream Diamonds book matched wall behind a freestanding bath',
    'cream-diamonds-2': 'Cream Diamonds 3D Texture wall detail',
    'cream-diamonds-swatch': 'Infinito 2.0 Cream Diamonds book matched slabs',
  };
  for (const [k, alt] of Object.entries(list)) M[k] = await media(k, alt);

  const fondovalle = await idOf('brand', 'fondovalle');
  const porcelain = await idOf('category', 'porcelain-slabs');
  const mytop = await idOf('collection', 'my-top');

  // Fondovalle description from the "Η κορυφαία ιταλική αισθητική" post (only if still the seeded text)
  const fb = await one(`SELECT data FROM entries WHERE id=$1`, [fondovalle]);
  if (fb && fb.data.desc_en === 'Maker of MY TOP ceramic surfaces.') {
    await q(`UPDATE entries SET data = data || $2::jsonb WHERE id=$1`, [fondovalle, JSON.stringify({
      desc_en: 'Italian design by Fondovalle, maker of MY TOP. Large format slabs for kitchens, bathrooms, floors and walls: scratch resistant, resistant to heat and stains, ideal for modern and luxury interiors.',
      desc_el: 'Αυθεντικός ιταλικός σχεδιασμός από τη Fondovalle, δημιουργό των MY TOP. Πλάκες μεγάλων διαστάσεων για κουζίνες, μπάνια, δάπεδα και τοίχους, αντιχαρακτικές, ανθεκτικές στη θερμότητα και τους λεκέδες, ιδανικές για μοντέρνες και πολυτελείς εφαρμογές.',
    })]);
  }

  // New application confirmed by the Fondovalle post: floors
  await entry('application', 'flooring', {
    name_en: 'Flooring', name_el: 'Δάπεδα',
    desc_en: 'Large slabs with few joints, so the floor continues the material of the kitchen or bathroom.',
    desc_el: 'Μεγάλες πλάκες με λίγους αρμούς, ώστε το δάπεδο να συνεχίζει το υλικό της κουζίνας ή του μπάνιου.',
    product_ids: [],
  }, [M['ebur-vein-1']]);
  const A = {};
  for (const s of ['kitchens', 'bathrooms', 'countertops-islands', 'wall-cladding', 'staircases', 'hospitality', 'flooring']) A[s] = await idOf('application', s);

  // Collections
  const infinito = await entry('collection', 'infinito-2-0', {
    name_en: 'Infinito 2.0', name_el: 'Infinito 2.0',
    tagline_en: 'Rare stones, in slabs of 163 x 324 cm.', tagline_el: 'Σπάνιες πέτρες, σε πλάκες 163 x 324 cm.',
    desc_en: 'Infinito 2.0 by Fondovalle, part of the MY TOP range. Large 12 mm slabs of 163 x 324 cm that reinterpret rare marbles and stones, in 3D Texture and ALL LIGHT polished surfaces.',
    desc_el: 'Η σειρά Infinito 2.0 της Fondovalle, μέρος της γκάμας MY TOP. Μεγάλες πλάκες 12 mm, 163 x 324 cm, που αναπαράγουν σπάνια μάρμαρα και πέτρες, σε επιφάνειες 3D Texture και ALL LIGHT γυαλιστερές.',
    brand_id: fondovalle,
    application_ids: [A.kitchens, A.bathrooms, A['countertops-islands'], A['wall-cladding'], A.hospitality],
  }, [M['calacatta-paris-1'], M['tiger-1'], M['labradorite-1'], M['cream-diamonds-1'], M['calacatta-paris-2']]);
  const stonelab = await entry('collection', 'stone-lab', {
    name_en: 'Stone Lab', name_el: 'Stone Lab',
    tagline_en: 'Travertines and stones, with a natural touch.', tagline_el: 'Travertino και πέτρες, με φυσική αφή.',
    desc_en: 'Stone Lab by Fondovalle, part of the MY TOP range. Travertines and stones in 12 mm slabs of 163 x 324 cm, with Real Matt and Full 3D Texture surfaces.',
    desc_el: 'Η σειρά Stone Lab της Fondovalle, μέρος της γκάμας MY TOP. Travertino και πέτρες σε πλάκες 12 mm, 163 x 324 cm, με επιφάνειες Real Matt και Full 3D Texture.',
    brand_id: fondovalle,
    application_ids: [A.kitchens, A.bathrooms, A['countertops-islands'], A.flooring],
  }, [M['fuscus-1'], M['sikelia-1'], M['fuscus-2']]);

  const P = (o) => ({
    category_id: porcelain, brand_id: fondovalle, specs_extra: [],
    features_en: [], features_el: [],
    ...o,
    specs: { material_en: 'Porcelain', material_el: 'Πορσελάνη', thickness: '12 mm', dimensions: '163 x 324 cm', ...o.specs },
  });
  const realMatt = { finish_en: 'Real Matt', finish_el: 'Real Matt' };
  const tex3d = { finish_en: '3D Texture', finish_el: '3D Texture' };
  const allLight = { finish_en: 'ALL LIGHT polished', finish_el: 'ALL LIGHT γυαλιστερό' };

  await entry('product', 'royal-travertino-ebur-vein', P({
    name_en: 'Royal Travertino Ebur Vein', name_el: 'Royal Travertino Ebur Vein', collection_id: mytop,
    tagline_en: 'A perfectly matt finish with a velvety touch.', tagline_el: 'Απόλυτα ματ φινίρισμα με βελούδινη αφή.',
    desc_en: 'The soft, vein cut look of ivory travertine for kitchens, floors and walls. Its Real Matt surface is perfectly matt with a velvety touch, for remarkable authenticity and realism.',
    desc_el: 'Η απαλή όψη του ιβουάρ travertino για κουζίνες, δάπεδα και τοίχους. Η επιφάνεια Real Matt είναι απόλυτα ματ με βελούδινη αφή, για εντυπωσιακή αυθεντικότητα και ρεαλισμό.',
    features_en: ['Real Matt surface', 'Velvety touch', 'Kitchens, islands, floors and walls'],
    features_el: ['Επιφάνεια Real Matt', 'Βελούδινη αφή', 'Κουζίνες, νησίδες, δάπεδα και τοίχοι'],
    specs: { ...realMatt, thickness: '', dimensions: '', colour_en: 'Ivory', colour_el: 'Ιβουάρ' },
    application_ids: [A.kitchens, A['countertops-islands'], A.flooring, A['wall-cladding']],
    admin_note: 'Confirm slab size and thickness for this colour (the post did not state them).',
  }), [M['ebur-vein-1'], M['ebur-vein-2'], M['ebur-vein-swatch'], M['real-matt']]);

  await entry('product', 'travertino-fuscus', P({
    name_en: 'Travertino Fuscus', name_el: 'Travertino Fuscus', collection_id: stonelab,
    tagline_en: 'Dark travertine with the realism of Real Matt.', tagline_el: 'Σκούρο travertino με τον ρεαλισμό του Real Matt.',
    desc_en: 'The remarkable authenticity and realism of the innovative Real Matt surface. Travertino Fuscus brings the depth of dark travertine to bathrooms, vanities, walls and floors.',
    desc_el: 'Η εντυπωσιακή αυθεντικότητα και ο ρεαλισμός της καινοτόμου επιφάνειας Real Matt. Το Travertino Fuscus φέρνει το βάθος του σκούρου travertino σε μπάνια, πάγκους νιπτήρων, τοίχους και δάπεδα.',
    features_en: ['Real Matt surface', 'Slabs of 163 x 324 cm', 'Bathrooms, vanities, walls and floors'],
    features_el: ['Επιφάνεια Real Matt', 'Πλάκες 163 x 324 cm', 'Μπάνια, πάγκοι νιπτήρων, τοίχοι και δάπεδα'],
    specs: { ...realMatt, colour_en: 'Dark Brown', colour_el: 'Σκούρο Καφέ' },
    application_ids: [A.bathrooms, A['wall-cladding'], A.flooring],
    admin_note: 'The Facebook caption says "MyTop Royal Travertino Fuscus Vein", the product graphic says "Stone Lab Travertino Fuscus". Confirm the name.',
  }), [M['fuscus-1'], M['fuscus-2'], M['fuscus-swatch']]);

  await entry('product', 'sikelia', P({
    name_en: 'Sikelia', name_el: 'Sikelia', collection_id: stonelab,
    tagline_en: 'Inspired by the stones of Southern Italy.', tagline_el: 'Εμπνευσμένο από τις πέτρες της Νότιας Ιταλίας.',
    desc_en: 'Inspired by the stones of Southern Italy, Sikelia offers a texture full of details and strong realism. Carefully calibrated and balanced, it presents itself as a neutral surface, yet never mundane, thanks to its richness in details.',
    desc_el: 'Εμπνευσμένο από τις πέτρες της Νότιας Ιταλίας, το Sikelia προσφέρει μια υφή γεμάτη λεπτομέρειες και έντονο ρεαλισμό. Προσεκτικά ισορροπημένο, παρουσιάζεται ως μια ουδέτερη επιφάνεια, ποτέ όμως κοινότοπη, χάρη στον πλούτο των λεπτομερειών του.',
    features_en: ['Full 3D Texture', 'Neutral, detailed surface', 'Worktops and backsplashes'],
    features_el: ['Full 3D Texture', 'Ουδέτερη επιφάνεια με πλούσιες λεπτομέρειες', 'Πάγκοι και πλάτες κουζίνας'],
    specs: { finish_en: 'Full 3D Texture', finish_el: 'Full 3D Texture', colour_en: 'Taupe', colour_el: 'Γκρι Μπεζ' },
    application_ids: [A.kitchens, A['countertops-islands']],
  }), [M['sikelia-1'], M['sikelia-swatch']]);

  await entry('product', 'labradorite-royale', P({
    name_en: 'Labradorite Royale', name_el: 'Labradorite Royale', collection_id: infinito,
    tagline_en: 'Iridescent blue, polished to catch the light.', tagline_el: 'Ιριδίζον μπλε, γυαλισμένο για να πιάνει το φως.',
    desc_en: 'Iridescent reflections bring out the depth of blue and grey tones, while dense and subtle veins create the elegant pattern typical of Labradorite.',
    desc_el: 'Ιριδίζουσες ανταύγειες αναδεικνύουν το βάθος των μπλε και γκρι τόνων, ενώ πυκνά και λεπτά νερά δημιουργούν το κομψό σχέδιο που χαρακτηρίζει τον Λαβραδορίτη.',
    features_en: ['ALL LIGHT polished surface', 'Feature walls and statement pieces'],
    features_el: ['Γυαλιστερή επιφάνεια ALL LIGHT', 'Επενδύσεις τοίχων και κομμάτια που ξεχωρίζουν'],
    specs: { ...allLight, colour_en: 'Blue & Grey', colour_el: 'Μπλε & Γκρι' },
    application_ids: [A['wall-cladding'], A.hospitality],
  }), [M['labradorite-1'], M['labradorite-swatch']], { featured: true });

  await entry('product', 'calacatta-paris', P({
    name_en: 'Calacatta Paris', name_el: 'Calacatta Paris', collection_id: infinito,
    tagline_en: 'A pale marble with contrasting dark veins.', tagline_el: 'Ανοιχτόχρωμο μάρμαρο με σκούρες φλέβες.',
    desc_en: 'A pale marble featuring contrasting dark veins, intertwined to form a gently dappled effect.',
    desc_el: 'Ένα ανοιχτόχρωμο μάρμαρο με σκούρες φλέβες σε αντίθεση, που πλέκονται μεταξύ τους δημιουργώντας ένα απαλό, διάστικτο αποτέλεσμα.',
    features_en: ['3D Texture surface', 'Book matched walls and islands'],
    features_el: ['Επιφάνεια 3D Texture', 'Συμμετρικές επενδύσεις τοίχων και νησίδες'],
    specs: { ...tex3d, colour_en: 'Pale Grey', colour_el: 'Ανοιχτό Γκρι' },
    application_ids: [A.kitchens, A['countertops-islands'], A['wall-cladding']],
  }), [M['calacatta-paris-1'], M['calacatta-paris-2'], M['calacatta-paris-swatch']], { featured: true });

  await entry('product', 'tiger', P({
    name_en: 'Tiger', name_el: 'Tiger', collection_id: infinito,
    tagline_en: 'A pattern that radiates light.', tagline_el: 'Ένα σχέδιο που ακτινοβολεί φως.',
    desc_en: 'Bold veining and warm shades create a stunning pattern that radiates light. Pictured with Woodblock Brave Stripy Oak 120 x 278.',
    desc_el: 'Έντονες φλέβες και ζεστές αποχρώσεις δημιουργούν ένα εντυπωσιακό σχέδιο που ακτινοβολεί φως. Στη φωτογραφία μαζί με Woodblock Brave Stripy Oak 120 x 278.',
    features_en: ['ALL LIGHT polished surface', 'Reception desks, lobbies and feature walls'],
    features_el: ['Γυαλιστερή επιφάνεια ALL LIGHT', 'Ρεσεψιόν, lobbies και επενδύσεις τοίχων'],
    specs: { ...allLight, colour_en: 'Amber & Brown', colour_el: 'Κεχριμπαρί & Καφέ' },
    application_ids: [A.hospitality, A['wall-cladding']],
  }), [M['tiger-1'], M['tiger-2'], M['tiger-swatch']], { featured: true });

  await entry('product', 'cream-diamonds', P({
    name_en: 'Cream Diamonds', name_el: 'Cream Diamonds', collection_id: infinito,
    tagline_en: 'Millennia of history in a contemporary space.', tagline_el: 'Χιλιετίες ιστορίας σε έναν σύγχρονο χώρο.',
    desc_en: 'With 3D Texture surface technology, Cream Diamonds delivers unprecedented depth of look and detail. With its soft, enticing beauty, this interpretation evokes millennia of history within contemporary living spaces.',
    desc_el: 'Με την τεχνολογία επιφάνειας 3D Texture, το Cream Diamonds προσφέρει πρωτόγνωρο βάθος όψης και λεπτομέρειας. Με την απαλή, γοητευτική ομορφιά του, ζωντανεύει χιλιετίες ιστορίας μέσα σε σύγχρονους χώρους.',
    features_en: ['3D Texture surface', 'Book matched feature walls'],
    features_el: ['Επιφάνεια 3D Texture', 'Συμμετρικές επενδύσεις τοίχων'],
    specs: { ...tex3d, colour_en: 'Cream', colour_el: 'Κρεμ' },
    application_ids: [A.bathrooms, A['wall-cladding']],
  }), [M['cream-diamonds-1'], M['cream-diamonds-2'], M['cream-diamonds-swatch']]);

  // Refresh each application's material list
  const prods = await q(`SELECT id, data FROM entries WHERE type='product'`);
  for (const appId of Object.values(A).filter(Boolean)) {
    const ids = prods.filter((p) => (p.data.application_ids || []).includes(appId)).map((p) => p.id);
    await q(`UPDATE entries SET data = jsonb_set(data, '{product_ids}', $1::jsonb) WHERE id=$2`, [JSON.stringify(ids), appId]);
  }

  // Homepage featured materials, only if still the original default
  const home = (await one(`SELECT value FROM settings WHERE key='home'`))?.value;
  if (home) {
    const orig = await Promise.all(['fantasy-dark', 'travertino-ebur', 'magnus', 'mytop-ref-06', 'mytop-ref-04', 'mytop-ref-08'].map((s) => idOf('product', s)));
    if (JSON.stringify(home.featured_products) === JSON.stringify(orig)) {
      const next = await Promise.all(['fantasy-dark', 'calacatta-paris', 'tiger', 'labradorite-royale', 'travertino-ebur', 'magnus'].map((s) => idOf('product', s)));
      await q(`UPDATE settings SET value = jsonb_set(value, '{featured_products}', $1::jsonb) WHERE key='home'`, [JSON.stringify(next.filter(Boolean))]);
    }
  }
}

// Batch 3: different second image on the About page (only if still the original)
async function batch3() {
  const id = async (url) => (await one(`SELECT id FROM media WHERE url=$1 ORDER BY id LIMIT 1`, [url]))?.id ?? null;
  const oldId = await id('/seed/mytop-06-2.webp');
  const newId = await id('/seed/calacatta-paris-2.webp');
  const about = (await one(`SELECT value FROM settings WHERE key='about'`))?.value;
  if (about && newId && about.image_2 === oldId) {
    await q(`UPDATE settings SET value = jsonb_set(value, '{image_2}', $1::jsonb) WHERE key='about'`, [JSON.stringify(newId)]);
  }
}

// Batch 4: background image for the Contact page
async function batch4() {
  const img = (await one(`SELECT id FROM media WHERE url='/seed/ebur-vein-1.webp' ORDER BY id LIMIT 1`))?.id;
  const site = (await one(`SELECT value FROM settings WHERE key='site'`))?.value;
  if (img && site && !site.contact_image) await q(`UPDATE settings SET value = jsonb_set(value, '{contact_image}', $1::jsonb) WHERE key='site'`, [JSON.stringify(img)]);
}

const BATCHES = { 'fb-2': batch2, 'fb-3': batch3, 'fb-4': batch4 };

export async function applySeedBatches() {
  const row = await one(`SELECT value FROM settings WHERE key='seed'`);
  const done = row?.value?.batches || [];
  for (const [name, fn] of Object.entries(BATCHES)) {
    if (done.includes(name)) continue;
    console.log(`[seed] Applying content batch ${name}`);
    await fn();
    done.push(name);
    await q(`INSERT INTO settings (key, value) VALUES ('seed', $1) ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`, [JSON.stringify({ batches: done })]);
  }
}
