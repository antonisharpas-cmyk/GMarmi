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
    await q(`UPDATE entries SET data = json_patch(data, $2) WHERE id=$1`, [fondovalle, JSON.stringify({
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
    await q(`UPDATE entries SET data = json_set(data, '$.product_ids', json($1)) WHERE id=$2`, [JSON.stringify(ids), appId]);
  }

  // Homepage featured materials, only if still the original default
  const home = (await one(`SELECT value FROM settings WHERE key='home'`))?.value;
  if (home) {
    const orig = await Promise.all(['fantasy-dark', 'travertino-ebur', 'magnus', 'mytop-ref-06', 'mytop-ref-04', 'mytop-ref-08'].map((s) => idOf('product', s)));
    if (JSON.stringify(home.featured_products) === JSON.stringify(orig)) {
      const next = await Promise.all(['fantasy-dark', 'calacatta-paris', 'tiger', 'labradorite-royale', 'travertino-ebur', 'magnus'].map((s) => idOf('product', s)));
      await q(`UPDATE settings SET value = json_set(value, '$.featured_products', json($1)) WHERE key='home'`, [JSON.stringify(next.filter(Boolean))]);
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
    await q(`UPDATE settings SET value = json_set(value, '$.image_2', json($1)) WHERE key='about'`, [JSON.stringify(newId)]);
  }
}

// Batch 4: background image for the Contact page
async function batch4() {
  const img = (await one(`SELECT id FROM media WHERE url='/seed/ebur-vein-1.webp' ORDER BY id LIMIT 1`))?.id;
  const site = (await one(`SELECT value FROM settings WHERE key='site'`))?.value;
  if (img && site && !site.contact_image) await q(`UPDATE settings SET value = json_set(value, '$.contact_image', json($1)) WHERE key='site'`, [JSON.stringify(img)]);
}

// Batch 5: a staff account that only sees Enquiries, Live chat and My account
async function batch5() {
  const email = (process.env.STAFF_EMAIL || 'staff@gmmarmi.local').toLowerCase();
  if (await one(`SELECT id FROM users WHERE email=$1`, [email])) return;
  const bcrypt = (await import('bcryptjs')).default;
  const pw = process.env.STAFF_PASSWORD || 'GmStaff2026!';
  await q(`INSERT INTO users (email, name, role, password_hash) VALUES ($1,'Staff','staff',$2)`, [email, await bcrypt.hash(pw, 11)]);
  console.log(`[seed] Staff account created: ${email} (change the password after first login)`);
}

// Batch 6: corrected company information from the client (November 2026)
// applications (Flooring becomes Pools), material categories with formats, partners,
// application to material mapping, About text, founder, and the owner's other companies.
async function batch6() {
  const setData = (id, patch) => q(`UPDATE entries SET data = json_patch(data, $2) WHERE id=$1`, [id, JSON.stringify(patch)]);

  // ---- material categories, in this order ----
  const F = (t, w, l) => ({ t, w, l });
  const cats = [
    { old: 'porcelain-slabs', slug: 'mytop-fondovalle', name_en: 'MY TOP by Fondovalle', name_el: 'MY TOP by Fondovalle',
      desc_en: 'Italian ceramic surfaces in large slabs, applied as one continuous piece on countertops, islands and walls.',
      desc_el: 'Ιταλικές κεραμικές επιφάνειες σε μεγάλες πλάκες, που εφαρμόζονται ενιαία σε πάγκους, νησίδες και τοίχους.',
      formats: [F('6', 163, 324), F('12', 163, 324), F('20', 163, 324)] },
    { slug: 'rak-ceramics', name_en: 'RAK Ceramics', name_el: 'RAK Ceramics',
      desc_en: 'Maximus large format slabs by RAK Ceramics for countertops, walls, floors and furniture.',
      desc_el: 'Πλάκες μεγάλου μεγέθους Maximus της RAK Ceramics για πάγκους, τοίχους, δάπεδα και έπιπλα.',
      formats: [F('12', 162, 324), F('14', 144, 305), F('6, 9', 120, 280), F('9', 162, 162), F('9, 12', 120, 120), F('9, 14, 20', 60, 120)],
      admin_note: 'Formats taken from the RAK Maximus website (maximussurfaces.com). Confirm which sizes and thicknesses GM Andreou Marmi stocks.' },
    { slug: 'porcelanato', name_en: 'Porcelanato', name_el: 'Porcelanato',
      desc_en: 'Porcelain slabs in large formats and thicknesses from 15 to 20 mm, for floors, stairs and surfaces.',
      desc_el: 'Πλάκες πορσελάνης σε μεγάλες διαστάσεις και πάχη από 15 έως 20 mm, για δάπεδα, σκάλες και επιφάνειες.',
      formats: [F('15', 120, 240), F('18', 120, 240), F('18', 120, 320), F('20', 140, 305), F('20', 126, 180.5)] },
    { old: 'engineered-quartz', slug: 'quartz', name_en: 'Quartz', name_el: 'Χαλαζίας',
      desc_en: 'Engineered quartz with consistent colour and clean lines for kitchens and bathrooms.',
      desc_el: 'Τεχνητός χαλαζίας με ομοιόμορφο χρώμα και καθαρές γραμμές για κουζίνες και μπάνια.',
      formats: [F('20', 160, 320)] },
    { old: 'marble', slug: 'natural-marble', name_en: 'Natural Marble', name_el: 'Φυσικά Μάρμαρα',
      desc_en: 'Natural marble with unique veining, cut to the size of your project.',
      desc_el: 'Φυσικό μάρμαρο με μοναδικά νερά, κομμένο στις διαστάσεις του έργου σας.',
      formats: [], custom: true },
    { old: 'granite', slug: 'natural-granite', name_en: 'Natural Granite', name_el: 'Φυσικοί Γρανίτες',
      desc_en: 'Natural granite, strong and deep in colour, cut to the size of your project.',
      desc_el: 'Φυσικός γρανίτης, ανθεκτικός και με βάθος χρώματος, κομμένος στις διαστάσεις του έργου σας.',
      formats: [], custom: true },
  ];
  const C = {};
  let order = 1;
  for (const c of cats) {
    let id = (c.old && (await idOf('category', c.old))) || (await idOf('category', c.slug));
    const data = { name_en: c.name_en, name_el: c.name_el, desc_en: c.desc_en, desc_el: c.desc_el, formats: c.formats, custom_sizes: !!c.custom, admin_note: c.admin_note || (c.custom || c.slug === 'porcelanato' || c.slug === 'rak-ceramics' || c.slug === 'quartz' ? 'Photos for this category required from client.' : '') };
    if (id) {
      await setData(id, data);
      await q(`UPDATE entries SET slug=$2, sort_order=$3, published=TRUE WHERE id=$1`, [id, c.slug, order]);
    } else {
      id = (await one(`INSERT INTO entries (type, slug, sort_order, data, images, published) VALUES ('category',$1,$2,$3,'[]',TRUE) RETURNING id`, [c.slug, order, JSON.stringify(data)])).id;
    }
    C[c.slug] = id; order++;
  }

  // ---- applications: Flooring becomes Pools; materials per application ----
  const flooring = await idOf('application', 'flooring');
  if (flooring && !(await idOf('application', 'pools'))) {
    await setData(flooring, { name_en: 'Pools', name_el: 'Πισίνες',
      desc_en: 'Surfaces around and inside the pool, chosen for comfort, safety and durability.',
      desc_el: 'Επιφάνειες γύρω και μέσα στην πισίνα, επιλεγμένες για άνεση, ασφάλεια και αντοχή.',
      product_ids: [], admin_note: 'Pool photos and the materials used for pools are required from client.' });
    await q(`UPDATE entries SET slug='pools', images='[]', cover_id=NULL WHERE id=$1`, [flooring]);
    // the flooring products are not pool products
    for (const p of await q(`SELECT id, data FROM entries WHERE type='product'`)) {
      const ids = (p.data.application_ids || []).filter((x) => x !== flooring);
      if (ids.length !== (p.data.application_ids || []).length) await setData(p.id, { application_ids: ids });
    }
  }
  const main = [C['mytop-fondovalle'], C['rak-ceramics'], C.quartz, C['natural-granite']];
  const map = {
    kitchens: main, bathrooms: main, 'countertops-islands': main, hospitality: main,
    'wall-cladding': [C['mytop-fondovalle'], C['rak-ceramics']],
    staircases: [C['mytop-fondovalle'], C['rak-ceramics'], C.porcelanato, C.quartz, C['natural-marble'], C['natural-granite']],
    pools: [],
  };
  const appOrder = ['kitchens', 'bathrooms', 'countertops-islands', 'wall-cladding', 'staircases', 'hospitality', 'pools'];
  for (let i = 0; i < appOrder.length; i++) {
    const id = await idOf('application', appOrder[i]);
    if (!id) continue;
    await setData(id, { category_ids: map[appOrder[i]] });
    await q(`UPDATE entries SET sort_order=$2 WHERE id=$1`, [id, i + 1]);
  }

  // ---- partners (brands) ----
  const partners = [
    ['fondovalle', 'Fondovalle', 'https://fondovalle.it/', 'Italian porcelain surfaces, maker of MY TOP.', 'Ιταλικές πορσελάνινες επιφάνειες, δημιουργός των MY TOP.'],
    ['quarella', 'Quarella', 'https://www.quarella.com/', 'Italian quartz and marble surfaces.', 'Ιταλικές επιφάνειες χαλαζία και μαρμάρου.'],
    ['rak-ceramics', 'RAK Ceramics', 'https://www.rakceramics.com/en/', 'Ceramic surfaces and Maximus large slabs.', 'Κεραμικές επιφάνειες και μεγάλες πλάκες Maximus.'],
    ['sachanas-marble', 'Sachanas Marble', 'https://marblesachanas.gr', 'Greek natural marble.', 'Ελληνικά φυσικά μάρμαρα.'],
    ['rekalis-marble', 'Rekalis Marble', 'https://rekalis.gr/en/', 'Greek natural marble.', 'Ελληνικά φυσικά μάρμαρα.'],
    ['solomonidis-marbles', 'Solomonidis Marbles', 'https://instagram.com/solomonidi_marbles', 'Marble, granite and quartz.', 'Μάρμαρα, γρανίτες και χαλαζίας.'],
  ];
  let bo = 1;
  for (const [slug, name, url, den, del] of partners) {
    const data = { name_en: name, name_el: name, website: url, desc_en: den, desc_el: del };
    const id = await idOf('brand', slug);
    if (id) { await setData(id, data); await q(`UPDATE entries SET sort_order=$2 WHERE id=$1`, [id, bo]); }
    else await q(`INSERT INTO entries (type, slug, sort_order, data, published) VALUES ('brand',$1,$2,$3,TRUE)`, [slug, bo, JSON.stringify(data)]);
    bo++;
  }

  // ---- About, founder, group companies, homepage "why" ----
  const patchSetting = async (key, patch) => {
    const cur = (await one(`SELECT value FROM settings WHERE key=$1`, [key]))?.value || {};
    await q(`INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`, [key, JSON.stringify({ ...cur, ...patch })]);
  };
  await patchSetting('about', {
    intro_en: 'Since 2002, G. M. Andreou Marmi Ltd has supplied natural marble, natural granite, quartz and large ceramic and porcelain slabs from Larnaca, Cyprus, to homeowners and to professionals alike.',
    intro_el: 'Από το 2002, η G. M. Andreou Marmi Ltd προμηθεύει από τη Λάρνακα φυσικά μάρμαρα, φυσικούς γρανίτες, χαλαζία και μεγάλες κεραμικές και πορσελάνινες πλάκες, τόσο σε ιδιώτες όσο και σε επαγγελματίες.',
    body_en: 'We work with homeowners, architects, designers, contractors and developers, on single kitchens and on complete buildings.\n\nOur materials come from partners we trust in Italy, Greece and beyond, including Fondovalle, Quarella, RAK Ceramics, Sachanas Marble, Rekalis Marble and Solomonidis Marbles.\n\nVisit our showroom in the Livadia Industrial Area, Larnaca, to see the materials in person.',
    body_el: 'Συνεργαζόμαστε με ιδιώτες, αρχιτέκτονες, σχεδιαστές, εργολάβους και αναπτυξιακές εταιρείες, από μία κουζίνα μέχρι ολόκληρα κτήρια.\n\nΤα υλικά μας προέρχονται από συνεργάτες που εμπιστευόμαστε στην Ιταλία, την Ελλάδα και αλλού, όπως οι Fondovalle, Quarella, RAK Ceramics, Sachanas Marble, Rekalis Marble και Solomonidis Marbles.\n\nΕπισκεφθείτε τον εκθεσιακό μας χώρο στη Βιομηχανική Περιοχή Λιβαδιών, στη Λάρνακα, για να δείτε τα υλικά από κοντά.',
    since: '2002',
    founder_name_en: 'Marios Andreou', founder_name_el: 'Μάριος Ανδρέου',
    founder_role_en: 'Visionary, Founder and Director', founder_role_el: 'Οραματιστής, Ιδρυτής και Διευθυντής',
    founder_bio_en: 'With more than 25 years of experience in marble and construction, Marios Andreou never stops dreaming and innovating. As the person behind G.M. Andreou Marmi Ltd, G.M. Marmi Properties, G.M. Respect Developers Ltd, M.D. Dynamic Properties Ltd, Coffee Magek Ltd and Cafe Route 66 Larnaca, he leads with a passion for quality, for creating unique spaces and for serving customers with professionalism.',
    founder_bio_el: 'Με περισσότερα από 25 χρόνια εμπειρίας στον χώρο του μαρμάρου και των κατασκευών, ο Μάριος Ανδρέου δεν σταματά να ονειρεύεται και να καινοτομεί. Ως ο άνθρωπος πίσω από τις εταιρείες G.M. Andreou Marmi LTD, G.M. Marmi Properties, G.M. Respect Developers Ltd, M.D. Dynamic Properties Ltd, Coffee Magek Ltd και Cafe Route 66 Larnaca, καθοδηγεί με πάθος για την ποιότητα, τη δημιουργία μοναδικών χώρων και την εξυπηρέτηση των πελατών με επαγγελματισμό.',
    founder_quote_en: 'For me, every project is personal. I want to see our creations come to life and become part of people’s everyday lives.',
    founder_quote_el: 'Για εμένα, κάθε έργο είναι προσωπικό. Θέλω να βλέπω τις δημιουργίες μας να ζωντανεύουν και να γίνονται μέρος της καθημερινότητας των ανθρώπων.',
    founder_image: null,
  });
  await patchSetting('site', {
    group_companies: [
      { name: 'G.M. Marmi Properties', url: '' },
      { name: 'G.M. Respect Developers Ltd', url: '' },
      { name: 'M.D. Dynamic Properties Ltd', url: '' },
      { name: 'Coffee Magek Ltd', url: '' },
      { name: 'Cafe Route 66 Larnaca', url: '' },
      { name: 'APEX Fitness Centre', url: 'https://www.apexfitnesscentrecy.com' },
    ],
  });
  const home = (await one(`SELECT value FROM settings WHERE key='home'`))?.value || {};
  const why = [...(home.why || [])];
  why.unshift({ t_en: 'Since 2002', t_el: 'Από το 2002', d_en: 'More than two decades supplying marble and surfaces in Cyprus.', d_el: 'Πάνω από δύο δεκαετίες στην προμήθεια μαρμάρων και επιφανειών στην Κύπρο.' });
  const forAll = { t_en: 'For homes and professionals', t_el: 'Για ιδιώτες και επαγγελματίες', d_en: 'We work with homeowners, architects, contractors and developers.', d_el: 'Συνεργαζόμαστε με ιδιώτες, αρχιτέκτονες, εργολάβους και αναπτυξιακές εταιρείες.' };
  // keep four points: Since 2002, Exclusive materials, For homes and professionals, See it in person
  const pick = (t) => why.find((w) => w.t_en === t);
  await patchSetting('home', { why: [why[0], pick('Exclusive materials'), forAll, pick('See it in person')].filter(Boolean) });
}

// Batch 7: founded 2003, clearer About text, Our Group page text
async function batch7() {
  const patchSetting = async (key, patch) => {
    const cur = (await one(`SELECT value FROM settings WHERE key=$1`, [key]))?.value || {};
    await q(`INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`, [key, JSON.stringify({ ...cur, ...patch })]);
  };
  await patchSetting('about', {
    since: '2003',
    intro_en: 'Since 2003, G. M. Andreou Marmi Ltd has brought natural marble, natural granite, quartz and large ceramic and porcelain slabs from leading producers abroad to Cyprus and Greece. We work with companies, developers and contractors, and with homeowners who simply want to renew their kitchen or bathroom.',
    intro_el: 'Από το 2003, η G. M. Andreou Marmi Ltd φέρνει φυσικά μάρμαρα, φυσικούς γρανίτες, χαλαζία και μεγάλες κεραμικές και πορσελάνινες πλάκες από κορυφαίους παραγωγούς του εξωτερικού στην Κύπρο και την Ελλάδα. Συνεργαζόμαστε με εταιρείες, developers και κατασκευαστές, αλλά και με ιδιώτες που θέλουν απλώς να ανανεώσουν την κουζίνα ή το μπάνιο τους.',
    body_en: 'Our materials come from partners we trust, including Fondovalle, Quarella, RAK Ceramics, Sachanas Marble, Rekalis Marble and Solomonidis Marbles.\n\nVisit our showroom in the Livadia Industrial Area, Larnaca, to see the materials in person.',
    body_el: 'Τα υλικά μας προέρχονται από συνεργάτες που εμπιστευόμαστε, όπως οι Fondovalle, Quarella, RAK Ceramics, Sachanas Marble, Rekalis Marble και Solomonidis Marbles.\n\nΕπισκεφθείτε τον εκθεσιακό μας χώρο στη Βιομηχανική Περιοχή Λιβαδιών, στη Λάρνακα, για να δείτε τα υλικά από κοντά.',
  });
  await patchSetting('site', {
    group_text_en: 'G. M. Andreou Marmi is part of a group of companies founded and led by Marios Andreou, with activities in property development, hospitality and fitness: G.M. Marmi Properties, G.M. Respect Developers Ltd, M.D. Dynamic Properties Ltd, Coffee Magek Ltd, Cafe Route 66 Larnaca and APEX Fitness Centre.',
    group_text_el: 'Η G. M. Andreou Marmi ανήκει σε έναν όμιλο εταιρειών που ίδρυσε και διοικεί ο Μάριος Ανδρέου, με δραστηριότητες στην ανάπτυξη ακινήτων, την εστίαση και την άθληση: G.M. Marmi Properties, G.M. Respect Developers Ltd, M.D. Dynamic Properties Ltd, Coffee Magek Ltd, Cafe Route 66 Larnaca και APEX Fitness Centre.',
  });
  const home = (await one(`SELECT value FROM settings WHERE key='home'`))?.value || {};
  const why = (home.why || []).map((w) => (w.t_en === 'Since 2002' ? { ...w, t_en: 'Since 2003', t_el: 'Από το 2003' } : w));
  await patchSetting('home', { why });
}

// Batch 8: partner logos
async function batch8() {
  for (const slug of ['fondovalle', 'quarella', 'rak-ceramics', 'sachanas-marble', 'rekalis-marble', 'solomonidis-marbles']) {
    const id = await idOf('brand', slug);
    if (!id) continue;
    const cur = await one(`SELECT images FROM entries WHERE id=$1`, [id]);
    if ((cur?.images || []).length) continue; // a logo was already uploaded in the admin
    const url = `/seed/logo-${slug}.png`;
    const m = await one(`INSERT INTO media (filename, alt_en, alt_el, url, url_sm, tags) VALUES ($1,$2,$2,$3,$3,'logo') RETURNING id`, [`logo-${slug}.png`, `${slug} logo`, url]);
    await q(`UPDATE entries SET images=$2, cover_id=$3 WHERE id=$1`, [id, JSON.stringify([m.id]), m.id]);
  }
}

// Batch 9: three MY TOP Infinito 2.0 kitchen colours (images from fondovalle.it)
async function batch9() {
  const cat = await idOf('category', 'mytop-fondovalle');
  const col = await idOf('collection', 'infinito-2-0');
  const brand = await idOf('brand', 'fondovalle');
  const kitchens = await idOf('application', 'kitchens');
  const islands = await idOf('application', 'countertops-islands');
  const list = [
    ['calacatta-gold', 'Calacatta Gold', 'Natural / Honed / Polished (12 mm), Natural / Polished (20 mm)', 'Φυσικό / Honed / Γυαλιστερό (12 mm), Φυσικό / Γυαλιστερό (20 mm)', [{ t: '12', w: 163, l: 324 }, { t: '20', w: 163, l: 324 }],
      'White Calacatta with warm golden and grey veins, a classic for kitchen walls and worktops.', 'Λευκό Calacatta με ζεστά χρυσαφένια και γκρι νερά, κλασική επιλογή για τοίχους και πάγκους κουζίνας.', 'Warm White', 'Ζεστό Λευκό', -3],
    ['calacatta-venice', 'Calacatta Venice', 'Natural / Polished', 'Φυσικό / Γυαλιστερό', [{ t: '12', w: 163, l: 324 }],
      'A soft ivory marble look with gentle golden veining, made for islands and full height backsplashes.', 'Απαλή ιβουάρ όψη μαρμάρου με διακριτικά χρυσαφένια νερά, για νησίδες και πλάτες σε όλο το ύψος.', 'Ivory', 'Ιβουάρ', -2],
    ['statuario-extra', 'Statuario Extra', 'Natural / Honed / Polished (12 mm), Natural / Polished (20 mm)', 'Φυσικό / Honed / Γυαλιστερό (12 mm), Φυσικό / Γυαλιστερό (20 mm)', [{ t: '12', w: 163, l: 324 }, { t: '20', w: 163, l: 324 }],
      'Bright white with bold grey veins, for clean and contemporary kitchens.', 'Φωτεινό λευκό με έντονα γκρι νερά, για καθαρές και σύγχρονες κουζίνες.', 'White & Grey', 'Λευκό & Γκρι', -1],
  ];
  for (const [slug, name, fen, fel, formats, den, del, cen, cel, sort] of list) {
    if (await idOf('product', slug)) continue;
    const amb = await media(`${slug}-kitchen`, `${name} kitchen by MY TOP Fondovalle`);
    const sw = await media(`${slug}-swatch`, `${name} slab`);
    const data = {
      name_en: name, name_el: name, category_id: cat, collection_id: col, brand_id: brand,
      tagline_en: den, tagline_el: del, desc_en: `${den} MY TOP Infinito 2.0 by Fondovalle.`, desc_el: `${del} MY TOP Infinito 2.0 της Fondovalle.`,
      features_en: [], features_el: [], specs_extra: [],
      specs: { material_en: 'Porcelain', material_el: 'Πορσελάνη', finish_en: fen, finish_el: fel, thickness: formats.map((f) => `${f.t} mm`).join(', '), dimensions: '163 x 324 cm', colour_en: cen, colour_el: cel },
      application_ids: [kitchens, islands].filter(Boolean),
    };
    await q(`INSERT INTO entries (type, slug, sort_order, data, images, cover_id, published) VALUES ('product',$1,$2,$3,$4,$5,TRUE)`,
      [slug, sort, JSON.stringify(data), JSON.stringify([amb, sw]), amb]);
  }
}

async function batch10() {
  const cat = await idOf('category', 'rak-ceramics');
  const brand = await idOf('brand', 'rak-ceramics');
  const kitchens = await idOf('application', 'kitchens');
  const islands = await idOf('application', 'countertops-islands');
  const list = [
    ['carrara-hyper-white', 'Carrara Hyper White', '144 x 305 cm', 'Polished', 'Γυαλιστερό',
      'Bright white Carrara look with soft grey veins, for clean and luminous kitchens.', 'Φωτεινό λευκό Carrara με απαλά γκρι νερά, για καθαρές και φωτεινές κουζίνες.', 'White & Grey', 'Λευκό & Γκρι', -3],
    ['moon-stone', 'Moon Stone', '120 x 280 cm, 162 x 324 cm', 'Matt', 'Ματ',
      'A light grey stone and cement look with fine flakes, calm and natural on islands and worktops.', 'Ανοιχτό γκρι όψη πέτρας και τσιμέντου με λεπτούς κόκκους, ήρεμη και φυσική σε νησίδες και πάγκους.', 'Light Grey', 'Ανοιχτό Γκρι', -2],
    ['black-beauty', 'Black Beauty', '144 x 305 cm', 'Polished', 'Γυαλιστερό',
      'Deep black marble look with golden and white veins, for bold statement kitchens.', 'Βαθύ μαύρο μάρμαρο με χρυσαφένια και λευκά νερά, για κουζίνες με έντονο χαρακτήρα.', 'Black & Gold', 'Μαύρο & Χρυσό', -1],
  ];
  for (const [base, name, dims, fen, fel, den, del, cen, cel, sort] of list) {
    const slug = `rak-${base}`;
    if (await idOf('product', slug)) continue;
    const amb = await media(`${slug}-kitchen`, `${name} kitchen by RAK Ceramics Maximus`);
    const sw = await media(`${slug}-swatch`, `${name} slab`);
    const data = {
      name_en: name, name_el: name, category_id: cat, collection_id: null, brand_id: brand,
      tagline_en: den, tagline_el: del, desc_en: `${den} Maximus slabs by RAK Ceramics.`, desc_el: `${del} Πλάκες Maximus της RAK Ceramics.`,
      features_en: [], features_el: [], specs_extra: [],
      specs: { material_en: 'Porcelain', material_el: 'Πορσελάνη', finish_en: fen, finish_el: fel, dimensions: dims, colour_en: cen, colour_el: cel },
      application_ids: [kitchens, islands].filter(Boolean),
    };
    await q(`INSERT INTO entries (type, slug, sort_order, data, images, cover_id, published) VALUES ('product',$1,$2,$3,$4,$5,TRUE)`,
      [slug, sort, JSON.stringify(data), JSON.stringify([amb, sw]), amb]);
  }
}

const BATCHES = { 'fb-2': batch2, 'fb-3': batch3, 'fb-4': batch4, 'fb-5': batch5, 'fb-6': batch6, 'fb-7': batch7, 'fb-8': batch8, 'fb-9': batch9, 'fb-10': batch10 };

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
