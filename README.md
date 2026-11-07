# G. M. Andreou Marmi Ltd · Website, CMS and Admin

Premium architectural materials showroom on the web, with a full admin console at `/admin`.

Stack: React 18, TypeScript, Tailwind, GSAP ScrollTrigger and Lenis (frontend, built with Vite), Node.js and Express (backend), SQLite (one database file, like the APEX site), images optimised with sharp and stored in the database.

## Run locally

```bash
npm install
cp .env.example .env        # optional for local work
npm run build
npm start                   # http://localhost:4010
```

For development with hot reload: `npm run dev` (Vite on :5180 proxies the API on :4010).

Without `DATABASE_URL`, the database file is created at `./data/gmarmi.db`. The first start seeds the catalogue from the client's Facebook posts and creates the super admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` (defaults: `admin@gmmarmi.local` / `ChangeMe123!`). Change the password after the first login.

To reset local content, stop the server and delete the `data` folder.

## Deploy on Render

`render.yaml` defines one web service (0.5 CPU, 512 MB, Frankfurt) with a 1 GB disk mounted at `/var/data`, and `DATABASE_URL=file:/var/data/gmarmi.db`. Build: `npm ci --include=dev && npm run build`. Start: `npm start`. Set `PUBLIC_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STAFF_EMAIL`, `STAFF_PASSWORD` and the SMTP settings before the first deploy.

## Structure

```
server/
  index.js     Express app, SEO tags per page, sitemap, robots, media serving
  public.js    Public API: site data, catalogue, enquiries, live chat, analytics
  admin.js     Admin API: auth, catalogue CRUD, media, enquiries CRM, chat, users, settings
  schema.sql   Database schema, SQLite (created automatically)
  seed.js      First run content (from the client's posts; unknowns marked)
  mail.js      Email (SMTP now, any provider later)
  media.js     Image optimisation (WebP, three sizes)
src/
  pages/       Home, Materials, Product, Applications, About, Our Group, Contact, FAQ, Legal, /link
  components/  Header, Footer, Reveal (animation system), Enquiry drawer and form, Chat widget, Cursor
  admin/       Dashboard, catalogue editors, drag and drop images, media library, enquiries, chat inbox, content, users
docs/PLAN.md   Research, information architecture, user journeys, data model, design and animation system
```

## Roles

| Role | Access |
| --- | --- |
| Super admin | Everything |
| Content manager | Products, categories, applications, brands, FAQs, media, website content |
| Sales / staff | Enquiries and live chat |

## Content still required from the client

Search the admin for the yellow ⚠ notes. In short: names for MY TOP Ref. 04 to 08, thickness and slab sizes, real marble, granite and quartz photography, opening hours, company history, legal details and the final domain.
