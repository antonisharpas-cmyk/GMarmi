// First run seed. Content comes only from the client's brief and their Facebook posts.
// Anything unknown is marked [CONTENT REQUIRED FROM CLIENT] and must be completed in /admin.
import bcrypt from 'bcryptjs';
import { q, one } from './db.js';

const REQ = '[CONTENT REQUIRED FROM CLIENT]';

async function media(name, alt) {
  const r = await one(
    `INSERT INTO media (filename, alt_en, alt_el, url, url_sm, tags) VALUES ($1,$2,$2,$3,$4,'seed') RETURNING id`,
    [name + '.webp', alt, `/seed/${name}.webp`, `/seed/${name}-sm.webp`]
  );
  return r.id;
}

async function entry(type, slug, sort, data, images = [], extra = {}) {
  const r = await one(
    `INSERT INTO entries (type, slug, sort_order, data, images, cover_id, published, featured, seo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [type, slug, sort, JSON.stringify(data), JSON.stringify(images), images[0] ?? null,
     extra.published ?? true, extra.featured ?? false, JSON.stringify(extra.seo || {})]
  );
  return r.id;
}

export async function seedIfEmpty() {
  const admin = process.env.ADMIN_EMAIL || 'admin@gmmarmi.local';
  const existingUser = await one('SELECT id FROM users LIMIT 1');
  if (!existingUser) {
    const pw = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    await q(`INSERT INTO users (email, name, password_hash, role) VALUES ($1,'Administrator',$2,'super_admin')`,
      [admin.toLowerCase(), await bcrypt.hash(pw, 11)]);
    console.log(`[seed] Super admin created: ${admin} (change the password after first login)`);
  }
  const has = await one('SELECT id FROM entries LIMIT 1');
  if (has) return;
  console.log('[seed] Seeding content from the client brief and Facebook posts');

  // ---------- Media ----------
  const M = {};
  const list = {
    'fantasy-dark-1': 'My Top Fantasy Dark kitchen island with waterfall edge',
    'fantasy-dark-2': 'My Top Fantasy Dark book matched backsplash',
    'fantasy-dark-3': 'My Top Fantasy Dark 3D Texture surface detail',
    'travertino-ebur-1': 'Travertino Ebur kitchen countertop and backsplash',
    'travertino-ebur-2': 'Travertino Ebur 3D Texture wall detail',
    'magnus-1': 'Magnus book matched feature wall in a hotel lobby',
    'magnus-2': 'Magnus veining detail',
    'mytop-04-1': 'MY TOP book matched wall behind a freestanding bath',
    'mytop-04-2': 'MY TOP 3D Texture wall detail',
    'mytop-05-1': 'MY TOP kitchen island and backsplash',
    'mytop-05-2': 'MY TOP bathroom wall with timber steps',
    'mytop-06-1': 'MY TOP bar counter and backlit shelving',
    'mytop-06-2': 'MY TOP bar counter detail',
    'mytop-07-1': 'MY TOP kitchen island and backsplash in grey',
    'mytop-07-2': 'MY TOP dining table legs in grey',
    'mytop-08-1': 'MY TOP dark wall panels and kitchen island',
    'mytop-08-2': 'MY TOP dark island with sink and stools',
  };
  for (const [k, alt] of Object.entries(list)) M[k] = await media(k, alt);

  // ---------- Brand & collection ----------
  const fondovalle = await entry('brand', 'fondovalle', 1, {
    name_en: 'Fondovalle', name_el: 'Fondovalle',
    desc_en: 'Maker of MY TOP ceramic surfaces.', desc_el: 'Κατασκευαστής των κεραμικών επιφανειών MY TOP.',
    website: '',
  });

  // ---------- Categories ----------
  const cat = {};
  cat.porcelain = await entry('category', 'porcelain-slabs', 4, {
    name_en: 'Porcelain Slabs', name_el: 'Πλάκες Πορσελάνης',
    desc_en: 'Large ceramic surfaces with the look of natural stone, made for everyday life.',
    desc_el: 'Μεγάλες κεραμικές επιφάνειες με την όψη του φυσικού λίθου, φτιαγμένες για την καθημερινότητα.',
  }, [M['fantasy-dark-2']]);
  cat.marble = await entry('category', 'marble', 1, {
    name_en: 'Natural Marble', name_el: 'Φυσικό Μάρμαρο',
    desc_en: 'Unique veining and timeless character, quarried by nature.',
    desc_el: 'Μοναδικά νερά και διαχρονικός χαρακτήρας, δημιουργία της φύσης.',
    admin_note: 'Cover image is a temporary porcelain photo. Replace with real marble photography.',
  }, [M['magnus-2']]);
  cat.granite = await entry('category', 'granite', 2, {
    name_en: 'Granite', name_el: 'Γρανίτης',
    desc_en: 'Natural strength and depth for surfaces that work hard.',
    desc_el: 'Φυσική αντοχή και βάθος για επιφάνειες που δουλεύουν σκληρά.',
    admin_note: 'Cover image is a temporary porcelain photo. Replace with real granite photography.',
  }, [M['mytop-08-1']]);
  cat.quartz = await entry('category', 'engineered-quartz', 3, {
    name_en: 'Engineered Quartz', name_el: 'Τεχνητός Χαλαζίας',
    desc_en: 'Consistent colour and clean lines for contemporary interiors.',
    desc_el: 'Ομοιόμορφο χρώμα και καθαρές γραμμές για σύγχρονους χώρους.',
    admin_note: 'Cover image is a temporary porcelain photo. Replace with real quartz photography.',
  }, [M['mytop-07-1']]);

  // ---------- Applications ----------
  const app = {};
  const apps = [
    ['kitchens', 'Kitchens', 'Κουζίνες', 'Countertops, islands and backsplashes that handle daily cooking.', 'Πάγκοι, νησίδες και πλάτες που αντέχουν την καθημερινή μαγειρική.', 'fantasy-dark-1'],
    ['bathrooms', 'Bathrooms', 'Μπάνια', 'Walls, vanities and feature surfaces with a calm, natural look.', 'Τοίχοι, πάγκοι νιπτήρων και επιφάνειες με ήρεμη, φυσική αισθητική.', 'mytop-04-1'],
    ['countertops-islands', 'Countertops & Islands', 'Πάγκοι & Νησίδες', 'One continuous surface from top to floor, with waterfall edges.', 'Μία ενιαία επιφάνεια από τον πάγκο ως το δάπεδο.', 'fantasy-dark-3'],
    ['wall-cladding', 'Wall Cladding', 'Επενδύσεις Τοίχων', 'Book matched feature walls that become the focal point of a room.', 'Επενδύσεις τοίχων που γίνονται το κέντρο του χώρου.', 'magnus-1'],
    ['staircases', 'Staircases', 'Σκαλοπάτια', 'Durable treads and risers in the same material as the rest of the space.', 'Ανθεκτικά σκαλοπάτια στο ίδιο υλικό με τον υπόλοιπο χώρο.', 'mytop-05-2'],
    ['hospitality', 'Hospitality & Bars', 'Φιλοξενία & Bars', 'Lobbies, bars and restaurants that need presence and resilience.', 'Lobbies, bars και εστιατόρια που χρειάζονται παρουσία και αντοχή.', 'mytop-06-1'],
  ];
  let i = 1;
  for (const [slug, en, el, den, del, img] of apps) {
    app[slug] = await entry('application', slug, i++, { name_en: en, name_el: el, desc_en: den, desc_el: del, product_ids: [] }, [M[img]]);
  }

  // ---------- Collection ----------
  const mytop = await entry('collection', 'my-top', 1, {
    name_en: 'MY TOP', name_el: 'MY TOP',
    tagline_en: 'Ceramic surfaces without limits.', tagline_el: 'Κεραμικές επιφάνειες χωρίς περιορισμούς.',
    desc_en: 'MY TOP by Fondovalle. Ceramic surfaces applied as one continuous piece on countertops, islands and cladding, offering clean aesthetics and architectural continuity in every space.',
    desc_el: 'MY TOP by Fondovalle. Κεραμικές επιφάνειες που εφαρμόζονται ενιαία σε πάγκους, νησίδες και επενδύσεις, προσφέροντας καθαρή αισθητική και αρχιτεκτονική συνέχεια σε κάθε χώρο.',
    body_en: 'Heat resistant. Scratch resistant. Stain resistant. 100% hygienic. For kitchens, bathrooms, staircases and cladding.',
    body_el: 'Ανθεκτικό στη θερμότητα. Δεν χαράζεται. Δεν λεκιάζει. 100% υγιεινό. Για κουζίνες, μπάνια, σκαλοπάτια και επενδύσεις.',
    brand_id: fondovalle,
    application_ids: Object.values(app),
  }, [M['fantasy-dark-1'], M['magnus-1'], M['travertino-ebur-1'], M['mytop-06-1'], M['mytop-04-1']], { featured: true });

  // ---------- Products ----------
  const mytopFeatures = {
    en: ['Heat resistant', 'Scratch resistant', 'Stain resistant', '100% hygienic', 'Zero maintenance'],
    el: ['Ανθεκτικό στη θερμότητα', 'Δεν χαράζεται', 'Δεν λεκιάζει', '100% υγιεινό', 'Μηδενική συντήρηση'],
  };
  const base = (o) => ({
    category_id: cat.porcelain, collection_id: mytop, brand_id: fondovalle,
    specs: { material_en: 'Porcelain', material_el: 'Πορσελάνη', finish_en: '', finish_el: '', thickness: '', dimensions: '', colour_en: '', colour_el: '' },
    specs_extra: [],
    ...o,
  });
  const P = {};
  P.fantasy = await entry('product', 'fantasy-dark', 1, base({
    name_en: 'Fantasy Dark', name_el: 'Fantasy Dark',
    tagline_en: 'The ultimate expression of natural beauty in porcelain.',
    tagline_el: 'Η απόλυτη έκφραση της φυσικής ομορφιάς σε πορσελάνη.',
    desc_en: 'With bold veining, unique depth and a striking 3D Texture, My Top Fantasy Dark turns every kitchen or space into a work of art. Ideal for countertops, islands, wall cladding and luxury interiors. Available exclusively from G. M. Andreou Marmi Ltd.',
    desc_el: 'Με έντονες φλέβες, μοναδικό βάθος και εντυπωσιακό 3D Texture, το My Top Fantasy Dark μετατρέπει κάθε κουζίνα ή χώρο σε ένα έργο τέχνης. Ιδανικό για πάγκους, νησίδες, επενδύσεις τοίχων και πολυτελείς εσωτερικούς χώρους. Διαθέσιμο αποκλειστικά από την G. M. Andreou Marmi Ltd.',
    features_en: ['3D Texture surface', 'Bold veining with unique depth', 'Exclusive to G. M. Andreou Marmi'],
    features_el: ['Επιφάνεια 3D Texture', 'Έντονες φλέβες με μοναδικό βάθος', 'Αποκλειστικά από την G. M. Andreou Marmi'],
    specs: { material_en: 'Porcelain', material_el: 'Πορσελάνη', finish_en: '3D Texture', finish_el: '3D Texture', thickness: '', dimensions: '', colour_en: 'Dark', colour_el: 'Σκούρο' },
    exclusive: true,
    application_ids: [app.kitchens, app['countertops-islands'], app['wall-cladding']],
  }), [M['fantasy-dark-1'], M['fantasy-dark-2'], M['fantasy-dark-3']], { featured: true });

  P.travertino = await entry('product', 'travertino-ebur', 2, base({
    name_en: 'Travertino Ebur', name_el: 'Travertino Ebur',
    tagline_en: 'The natural beauty of travertine, in porcelain.',
    tagline_el: 'Η φυσική ομορφιά του travertino, σε πορσελάνη.',
    desc_en: 'A porcelain version of travertine that is hard to tell apart from the original natural stone. Travertino Ebur by MY TOP Fondovalle is the most realistic imitation of natural travertine we have ever seen. With its unique texture, veining and 3D Texture technology, it offers the look of natural stone without the limitations and upkeep of the natural material.',
    desc_el: 'Η φυσική ομορφιά του travertino σε porcelain εκδοχή που δύσκολα ξεχωρίζει από το αυθεντικό φυσικό πέτρωμα. Η σειρά Travertino Ebur by MY TOP Fondovalle φέρνει την πιο ρεαλιστική απομίμηση φυσικού travertine που έχουμε δει ποτέ. Με μοναδική υφή, νερά και τεχνολογία 3D texture, προσφέρει την αισθητική του φυσικού λίθου χωρίς τους περιορισμούς και τη συντήρηση του φυσικού υλικού.',
    features_en: ['A completely natural appearance', 'Ideal for kitchens, bathrooms, cladding and countertops', 'Durable, easy to maintain, timeless design', 'You cannot tell it is porcelain'],
    features_el: ['Απόλυτα φυσική εμφάνιση', 'Ιδανικό για κουζίνες, μπάνια, επενδύσεις και πάγκους', 'Αντοχή, εύκολη συντήρηση και διαχρονικό design', 'Δεν καταλαβαίνεις ότι είναι πορσελάνη'],
    specs: { material_en: 'Porcelain', material_el: 'Πορσελάνη', finish_en: '3D Texture', finish_el: '3D Texture', thickness: '', dimensions: '', colour_en: 'Ivory', colour_el: 'Ιβουάρ' },
    application_ids: [app.kitchens, app.bathrooms, app['wall-cladding'], app['countertops-islands']],
  }), [M['travertino-ebur-1'], M['travertino-ebur-2']], { featured: true });

  P.magnus = await entry('product', 'magnus', 3, base({
    name_en: 'Magnus', name_el: 'Magnus',
    tagline_en: 'A material that does not go unnoticed.',
    tagline_el: 'Ένα υλικό που δεν περνά απαρατήρητο.',
    desc_en: 'Magnus by MY TOP Fondovalle stands out for its dynamic aesthetic, striking veining and unique character, creating spaces with a true identity.',
    desc_el: 'Το Magnus από MY TOP Fondovalle ξεχωρίζει για τη δυναμική του αισθητική, τις εντυπωσιακές φλέβες και τον μοναδικό χαρακτήρα του, δημιουργώντας χώρους με απόλυτη ταυτότητα.',
    features_en: ['Striking veining', 'Dynamic, characterful aesthetic'],
    features_el: ['Εντυπωσιακές φλέβες', 'Δυναμική αισθητική με χαρακτήρα'],
    specs: { material_en: 'Porcelain', material_el: 'Πορσελάνη', finish_en: '', finish_el: '', thickness: '', dimensions: '', colour_en: 'Rust & Green', colour_el: 'Σκουριά & Πράσινο' },
    application_ids: [app['wall-cladding'], app.hospitality],
  }), [M['magnus-1'], M['magnus-2']], { featured: true });

  const unnamed = [
    ['mytop-ref-04', 'MY TOP Ref. 04', 'mytop-04', 'Blue Grey', 'Γκρι Μπλε',
      'Modern spaces demand materials that combine aesthetics and performance.',
      'Οι σύγχρονοι χώροι απαιτούν υλικά που συνδυάζουν αισθητική και απόδοση.',
      'Surfaces designed to endure and to stand out. MY TOP by Fondovalle, for projects that make no compromises.',
      'Επιφάνειες σχεδιασμένες για να αντέχουν και να ξεχωρίζουν. MY TOP by Fondovalle, για έργα που δεν κάνουν συμβιβασμούς.',
      [app.bathrooms, app['wall-cladding']], '3D Texture'],
    ['mytop-ref-05', 'MY TOP Ref. 05', 'mytop-05', 'Beige & Gold', 'Μπεζ & Χρυσό',
      'When a material combines durability and aesthetics, it can be used anywhere.',
      'Όταν ένα υλικό συνδυάζει αντοχή και αισθητική, μπορεί να χρησιμοποιηθεί παντού.',
      'Without limits. Without worry in everyday use. MY TOP by Fondovalle, ceramic surfaces for every space.',
      'Χωρίς περιορισμούς. Χωρίς άγχος στην καθημερινή χρήση. MY TOP by Fondovalle, κεραμικές επιφάνειες για κάθε χώρο.',
      [app.kitchens, app.bathrooms, app['countertops-islands']], ''],
    ['mytop-ref-06', 'MY TOP Ref. 06', 'mytop-06', 'Amber', 'Κεχριμπαρί',
      'One continuous surface, from countertop to cladding.',
      'Μία ενιαία επιφάνεια, από τον πάγκο ως την επένδυση.',
      'MY TOP by Fondovalle ceramic surfaces are applied as one continuous piece on countertops, islands and cladding, offering clean aesthetics and architectural continuity in every space.',
      'Οι κεραμικές επιφάνειες MY TOP by Fondovalle εφαρμόζονται ενιαία σε πάγκους, νησίδες και επενδύσεις, προσφέροντας καθαρή αισθητική και αρχιτεκτονική συνέχεια σε κάθε χώρο.',
      [app.hospitality, app['countertops-islands'], app['wall-cladding']], ''],
    ['mytop-ref-07', 'MY TOP Ref. 07', 'mytop-07', 'White & Grey', 'Λευκό & Γκρι',
      'Every surface has its role.',
      'Κάθε επιφάνεια έχει τον ρόλο της.',
      'When the priority is heat resistance, everyday use without fear and zero maintenance, the choice is clear. MY TOP by Fondovalle, ceramic surfaces for kitchens and bathrooms, without limits.',
      'Όταν η προτεραιότητα είναι η αντοχή στη θερμότητα, η καθημερινή χρήση χωρίς φόβο και η μηδενική συντήρηση, τότε η επιλογή είναι ξεκάθαρη. MY TOP by Fondovalle, κεραμικές επιφάνειες για κουζίνες και μπάνια, χωρίς περιορισμούς.',
      [app.kitchens, app['countertops-islands']], ''],
    ['mytop-ref-08', 'MY TOP Ref. 08', 'mytop-08', 'Dark Grey', 'Σκούρο Γκρι',
      'Ceramic countertops without limits.',
      'Κεραμικοί πάγκοι χωρίς περιορισμούς.',
      'Heat resistant, scratch resistant, stain resistant and 100% hygienic. For kitchens, bathrooms, staircases and cladding.',
      'Ανθεκτικό στη θερμότητα, δεν χαράζεται, δεν λεκιάζει, 100% υγιεινό. Για κουζίνες, μπάνια, σκαλοπάτια και επενδύσεις.',
      [app.kitchens, app['countertops-islands'], app.staircases, app['wall-cladding']], ''],
  ];
  let s = 4;
  for (const [slug, name, img, cen, cel, ten, tel, den, del, apps2, finish] of unnamed) {
    P[slug] = await entry('product', slug, s++, base({
      name_en: name, name_el: name, tagline_en: ten, tagline_el: tel, desc_en: den, desc_el: del,
      features_en: mytopFeatures.en, features_el: mytopFeatures.el,
      specs: { material_en: 'Porcelain', material_el: 'Πορσελάνη', finish_en: finish, finish_el: finish, thickness: '', dimensions: '', colour_en: cen, colour_el: cel },
      application_ids: apps2,
      admin_note: 'Product name required from client. Image taken from a Facebook post without a product name.',
    }), [M[img + '-1'], M[img + '-2']]);
  }

  // link products to applications
  const prods = await q(`SELECT id, data FROM entries WHERE type='product'`);
  for (const [slug, appId] of Object.entries(app)) {
    const ids = prods.filter((p) => (p.data.application_ids || []).includes(appId)).map((p) => p.id);
    await q(`UPDATE entries SET data = jsonb_set(data, '{product_ids}', $1::jsonb) WHERE id=$2`, [JSON.stringify(ids), appId]);
  }

  // ---------- FAQs ----------
  const faqs = [
    ['materials', 'What are MY TOP surfaces?', 'Τι είναι οι επιφάνειες MY TOP;',
      'MY TOP by Fondovalle are ceramic (porcelain) surfaces that reproduce the look of natural stone. They can be applied as one continuous piece on countertops, islands and wall cladding.',
      'Οι MY TOP by Fondovalle είναι κεραμικές (πορσελάνινες) επιφάνειες που αναπαράγουν την όψη του φυσικού λίθου. Εφαρμόζονται ενιαία σε πάγκους, νησίδες και επενδύσεις τοίχων.'],
    ['materials', 'Are MY TOP countertops suitable for everyday kitchen use?', 'Είναι οι πάγκοι MY TOP κατάλληλοι για καθημερινή χρήση στην κουζίνα;',
      'Yes. They are heat resistant, scratch resistant, stain resistant and 100% hygienic, with zero maintenance.',
      'Ναι. Είναι ανθεκτικοί στη θερμότητα, δεν χαράζονται, δεν λεκιάζουν, είναι 100% υγιεινοί και δεν χρειάζονται συντήρηση.'],
    ['products', 'What does 3D Texture mean?', 'Τι σημαίνει 3D Texture;',
      'Selected surfaces such as Fantasy Dark and Travertino Ebur have a three dimensional texture that follows the veining, so the surface feels as natural as it looks.',
      'Επιλεγμένες επιφάνειες όπως το Fantasy Dark και το Travertino Ebur έχουν τρισδιάστατη υφή που ακολουθεί τα νερά, ώστε η επιφάνεια να είναι τόσο φυσική στην αφή όσο και στην όψη.'],
    ['showroom', 'Where can I see the materials in person?', 'Πού μπορώ να δω τα υλικά από κοντά;',
      'Visit us in the Livadia Industrial Area, Kellia, Livadia, Larnaca 7060. Call +357 24 667984 before your visit.',
      'Επισκεφθείτε μας στη Βιομηχανική Περιοχή Λιβαδιών, Κελλιά, Λιβάδια, Λάρνακα 7060. Καλέστε στο +357 24 667984 πριν την επίσκεψή σας.'],
    ['orders', 'How do I request a quote?', 'Πώς ζητώ προσφορά;',
      'Use the Request a Quote button on any material page, the enquiry form, or contact us at gmarmi@cytanet.com.cy. Plans and drawings can be attached to your enquiry.',
      'Πατήστε «Ζητήστε Προσφορά» σε οποιοδήποτε υλικό, συμπληρώστε τη φόρμα επικοινωνίας ή στείλτε μας στο gmarmi@cytanet.com.cy. Μπορείτε να επισυνάψετε σχέδια στο αίτημά σας.'],
  ];
  i = 1;
  for (const [c, qen, qel, aen, ael] of faqs) {
    await entry('faq', `faq-${i}`, i++, { category: c, q_en: qen, q_el: qel, a_en: aen, a_el: ael });
  }

  // ---------- Settings ----------
  const settings = {
    site: {
      company: 'G. M. Andreou Marmi Ltd',
      phone: '+357 24 667984',
      phone_raw: '+35724667984',
      email: 'gmarmi@cytanet.com.cy',
      address_en: 'Livadia Industrial Area, Kellia, Livadia, Larnaca 7060, Cyprus',
      address_el: 'Βιομηχανική Περιοχή Λιβαδιών, Κελλιά, Λιβάδια, Λάρνακα 7060, Κύπρος',
      hours_en: '', hours_el: '',
      map_query: 'G.M. Andreou Marmi Ltd, Livadia, Larnaca, Cyprus',
      instagram: 'https://www.instagram.com/gm.marmi/',
      facebook: 'https://www.facebook.com/profile.php?id=61554745574627',
      linkedin: 'https://www.linkedin.com/company/g-m-andreou-marmi-ltd/',
      whatsapp: '',
      chat_online: true,
      footer_en: 'Architectural surfaces for exceptional spaces.',
      footer_el: 'Αρχιτεκτονικές επιφάνειες για ξεχωριστούς χώρους.',
    },
    home: {
      hero_image: M['fantasy-dark-1'],
      hero_image_2: M['magnus-1'],
      hero_kicker_en: 'G. M. Andreou Marmi · Larnaca, Cyprus',
      hero_kicker_el: 'G. M. Andreou Marmi · Λάρνακα, Κύπρος',
      hero_title_en: 'Materials that define space',
      hero_title_el: 'Υλικά που ορίζουν τον χώρο',
      hero_sub_en: 'Marble, granite, engineered quartz and large porcelain slabs for exceptional interiors and architectural projects.',
      hero_sub_el: 'Μάρμαρο, γρανίτης, τεχνητός χαλαζίας και μεγάλες πλάκες πορσελάνης για ξεχωριστούς εσωτερικούς χώρους και αρχιτεκτονικά έργα.',
      cta_primary_en: 'Explore materials', cta_primary_el: 'Ανακαλύψτε τα υλικά',
      cta_secondary_en: 'Enquire', cta_secondary_el: 'Επικοινωνία',
      intro_words_en: ['Stone.', 'Surface.', 'Space.'],
      intro_words_el: ['Πέτρα.', 'Επιφάνεια.', 'Χώρος.'],
      intro_images: [M['fantasy-dark-3'], M['travertino-ebur-2'], M['mytop-07-1']],
      story_image: M['fantasy-dark-2'],
      story_lines_en: ['Natural character', 'Unique veining.', 'Timeless depth.', 'Explore the collection'],
      story_lines_el: ['Φυσικός χαρακτήρας', 'Μοναδικά νερά.', 'Διαχρονικό βάθος.', 'Δείτε τη συλλογή'],
      featured_collection: mytop,
      featured_products: [P.fantasy, P.travertino, P.magnus, P['mytop-ref-06'], P['mytop-ref-04'], P['mytop-ref-08']],
      why: [
        { t_en: 'Curated surfaces', t_el: 'Επιλεγμένες επιφάνειες', d_en: 'A considered selection of marble, granite, engineered quartz and porcelain slabs.', d_el: 'Μια προσεγμένη επιλογή από μάρμαρα, γρανίτες, τεχνητό χαλαζία και πλάκες πορσελάνης.' },
        { t_en: 'Exclusive materials', t_el: 'Αποκλειστικά υλικά', d_en: 'Surfaces such as My Top Fantasy Dark are available exclusively from G. M. Andreou Marmi.', d_el: 'Επιφάνειες όπως το My Top Fantasy Dark διατίθενται αποκλειστικά από την G. M. Andreou Marmi.' },
        { t_en: 'Made for everyday life', t_el: 'Για την καθημερινή ζωή', d_en: 'Heat, scratch and stain resistant ceramic surfaces with zero maintenance.', d_el: 'Κεραμικές επιφάνειες ανθεκτικές στη θερμότητα, τις χαραγές και τους λεκέδες, χωρίς συντήρηση.' },
        { t_en: 'See it in person', t_el: 'Δείτε τα από κοντά', d_en: 'Visit our showroom in the Livadia Industrial Area, Larnaca.', d_el: 'Επισκεφθείτε τον εκθεσιακό μας χώρο στη Βιομηχανική Περιοχή Λιβαδιών, Λάρνακα.' },
      ],
      cta_title_en: 'Find the material for your next space.',
      cta_title_el: 'Βρείτε το υλικό για τον επόμενο χώρο σας.',
      cta_button_en: 'Talk to us', cta_button_el: 'Μιλήστε μαζί μας',
      cta_image: M['mytop-08-1'],
      sections: [
        { key: 'hero', visible: true }, { key: 'intro', visible: true }, { key: 'materials', visible: true },
        { key: 'story', visible: true }, { key: 'collection', visible: true }, { key: 'applications', visible: true },
        { key: 'showcase', visible: true }, { key: 'projects', visible: true }, { key: 'why', visible: true }, { key: 'cta', visible: true },
      ],
    },
    about: {
      image: M['travertino-ebur-1'],
      image_2: M['mytop-06-2'],
      title_en: 'Surfaces chosen with care', title_el: 'Επιφάνειες επιλεγμένες με φροντίδα',
      intro_en: 'G. M. Andreou Marmi Ltd is based in Larnaca, Cyprus. We supply natural marble, granite, engineered quartz and large porcelain slabs for homes, hospitality and architectural projects.',
      intro_el: 'Η G. M. Andreou Marmi Ltd εδρεύει στη Λάρνακα. Προμηθεύουμε φυσικό μάρμαρο, γρανίτη, τεχνητό χαλαζία και μεγάλες πλάκες πορσελάνης για κατοικίες, χώρους φιλοξενίας και αρχιτεκτονικά έργα.',
      body_en: `Our story: ${REQ}\n\nSourcing and partners: ${REQ}\n\nShowroom and facilities: ${REQ}`,
      body_el: `Η ιστορία μας: ${REQ}\n\nΠρομήθεια και συνεργάτες: ${REQ}\n\nΕκθεσιακός χώρος και εγκαταστάσεις: ${REQ}`,
    },
    legal: {
      privacy_en: `This Privacy Policy explains how G. M. Andreou Marmi Ltd ("we") collects and uses personal data submitted through this website, such as enquiry forms and live chat.\n\nData we collect: name, company, email, phone, the content of your enquiry and any files you attach.\n\nWhy: to answer your enquiry and prepare quotes. Legal basis: your consent and our legitimate interest in responding to requests.\n\nRetention: ${REQ}\n\nYour rights: under the GDPR you may request access, correction or deletion of your data by writing to gmarmi@cytanet.com.cy.\n\nCompany registration and data controller details: ${REQ}`,
      privacy_el: `Η παρούσα Πολιτική Απορρήτου εξηγεί πώς η G. M. Andreou Marmi Ltd συλλέγει και χρησιμοποιεί προσωπικά δεδομένα που υποβάλλονται μέσω της ιστοσελίδας, όπως φόρμες επικοινωνίας και live chat.\n\nΔεδομένα: όνομα, εταιρεία, email, τηλέφωνο, περιεχόμενο αιτήματος και συνημμένα αρχεία.\n\nΣκοπός: η απάντηση στο αίτημά σας και η ετοιμασία προσφορών.\n\nΔιάρκεια διατήρησης: ${REQ}\n\nΔικαιώματα: σύμφωνα με τον GDPR μπορείτε να ζητήσετε πρόσβαση, διόρθωση ή διαγραφή των δεδομένων σας στο gmarmi@cytanet.com.cy.\n\nΣτοιχεία υπεύθυνου επεξεργασίας: ${REQ}`,
      cookies_en: `This website uses only the cookies and local storage needed for it to work, such as remembering your language and keeping an admin session signed in. ${REQ} (update this policy if analytics or marketing cookies are added).`,
      cookies_el: `Η ιστοσελίδα χρησιμοποιεί μόνο τα απαραίτητα cookies για τη λειτουργία της, όπως την αποθήκευση της γλώσσας. ${REQ}`,
      terms_en: `Content and images on this website are for information only. Product availability, specifications and prices are confirmed only in a written quotation.\n\nTerms of sale: ${REQ}`,
      terms_el: `Το περιεχόμενο και οι εικόνες της ιστοσελίδας είναι ενημερωτικά. Διαθεσιμότητα, προδιαγραφές και τιμές επιβεβαιώνονται μόνο με γραπτή προσφορά.\n\nΌροι πώλησης: ${REQ}`,
    },
    seo: {
      title_en: 'G. M. Andreou Marmi Ltd | Architectural Surfaces, Larnaca Cyprus',
      title_el: 'G. M. Andreou Marmi Ltd | Αρχιτεκτονικές Επιφάνειες, Λάρνακα',
      desc_en: 'Porcelain slabs, marble, granite and engineered quartz for kitchens, bathrooms and architectural interiors. Showroom in Livadia, Larnaca.',
      desc_el: 'Πλάκες πορσελάνης, μάρμαρα, γρανίτες και τεχνητός χαλαζίας για κουζίνες, μπάνια και εσωτερικούς χώρους. Λιβάδια, Λάρνακα.',
    },
  };
  for (const [k, v] of Object.entries(settings)) {
    await q(`INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING`, [k, JSON.stringify(v)]);
  }
  console.log('[seed] Done');
}
