# GM Andreou Marmi · Strategy and system

## 1. Industry research

The premium surfaces market splits into two kinds of websites. Natural stone houses (Antolini, Levantina) sell rarity and character: huge slab photography, few words, the material named like a work of art. Engineered and sintered surface brands (Cosentino, Neolith) sell performance and range: strong filtering by colour, finish, thickness and format, inspiration by room, and an obvious path to a sample or quote. Local Cyprus suppliers, Shialis Marbles among them, are showroom led: the website exists to make people visit or call.

GM Andreou Marmi sits between both worlds. Its social media shows a clear direction: Italian porcelain slabs (MY TOP by Fondovalle) styled in dark wood, bronze and warm stone interiors, with natural stone in the background of the business. The website therefore borrows the emotion of the natural stone houses and the usability of the surface brands, and keeps the showroom in Larnaca as the destination.

## 2. Competitor insights we used

1. Material first: the slab is the hero, interiors second, text last (Antolini).
2. Inspiration by space: visitors think in kitchens and bathrooms, not in SKUs (Cosentino).
3. Filters only where data exists: colour, finish, thickness, size (Neolith).
4. Every material page ends in a clear request path with the product attached (all of them).
5. Showroom, phone and address always one tap away (Cyprus suppliers).

Nothing was copied: no layouts, text, branding or imagery from those sites.

## 3. Information architecture

```
Home
Materials            /materials, /materials/{category}, /materials/{category}/{product}
Collections          /collections, /collections/{slug}
Applications         /applications, /applications/{slug}
Projects             /projects, /projects/{slug}
About                /about
Contact              /contact (form, map, details)
FAQ, Privacy, Cookies, Terms
/link                hidden link in bio page for Instagram and Facebook
/el/...              Greek version of every page
/admin               admin console
```

Global: header with EN | GR, Instagram, ENQUIRE (opens an enquiry drawer from any page), floating live chat, footer with ErgonSite credit and legal links.

## 4. User journeys

Homeowner: Instagram post → home hero → Applications · Kitchens → Fantasy Dark → Request information (product attached) → confirmation email → sales follow up.

Architect / interior designer: Materials → filter by finish or colour → product page with specifications → Request a quote with drawings attached (PDF, DWG) → enquiry type Architect.

Contractor / developer: Projects or Collections → materials used → Request a quote, or live chat for quick availability questions; the chat can be converted into an enquiry by staff.

Showroom visitor: Contact → address, map, phone tap to call → enquiry type Showroom visit.

## 5. Admin architecture

Dashboard (new and unread enquiries, open chats, catalogue counts, 30 day analytics, activity). Catalogue: Products, Categories, Collections, Brands, Applications, Projects, FAQs, all with English and Greek fields, publish, feature, drag to reorder, duplicate, SEO, drag and drop galleries with cover choice and replace. Media library with usage tracking. Website content: homepage sections (reorder and hide), hero, story, featured items, why points, final CTA, contact and social, chat online switch, About, legal pages, default SEO. Enquiries CRM: filter, search, sort, assign, statuses, internal notes, email reply, attachments, archive, CSV export. Live chat inbox with status, unread state and customer panel. Users with three roles.

## 6. Data model

`users` · `media` · `entries` (type = category, brand, collection, application, product, project, faq; bilingual fields and relations in JSONB; ordered image ids and cover) · `enquiries` · `enquiry_notes` · `chat_conversations` (channel ready for WhatsApp) · `chat_messages` · `settings` (site, home, about, legal, seo) · `activity` · `analytics_events`.

Relations: product → category, collection, brand, applications; collection → brand, applications; application → products; project → products, collections, applications; enquiry → product.

One flexible entries table keeps the first version maintainable while still living in PostgreSQL; any type can be promoted to its own table later (stock, ERP, technical sheets) without changing the public URLs.

## 7. Design system

Colours (from the logo's black and white and the brand's posts): ivory #F6F2EC, marble #FBF9F6, stone #E7E0D5, sand #D6CBBB, taupe #A3968A, warm grey #6F675F, charcoal #1D1B19, ink #121110, deep brown #3A2D24, bronze accent #9A7A55 (accent only).

Type: Cormorant Garamond for display (close to the logo's classical serif), Marcellus for small caps headings, Manrope for interface and body. Large light display sizes, generous letter spacing on labels, square corners, thin rules instead of cards.

## 8. Animation system

`Reveal` component with six variants: left, right, up (vertical clip), mask (inset reveal with zoom out), scale (1.12 to 1), fade; subtle parallax on desktop. Grids rotate variants so neighbouring images never enter the same way. `RiseText` reveals headlines word by word. Pinned scroll scenes on the homepage: hero side reveal, Stone · Surface · Space sequence, horizontal materials track (desktop only), material story with changing lines, collection image expanding from 40% to full screen. Lenis smooth scrolling on desktop, custom cursor (VIEW, EXPLORE, ENQUIRE) on pointer devices, short curtain page transition. Everything uses transform, opacity and clip path, and all motion is switched off for prefers reduced motion.
