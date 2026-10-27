# G. M. Andreou Marmi Ltd · Website, CMS and Admin

Premium architectural materials showroom on the web, with a full admin console at `/admin`.

Stack: React 18, TypeScript, Tailwind, GSAP ScrollTrigger and Lenis (frontend, built with Vite), Node.js and Express (backend), PostgreSQL (database), images optimised with sharp and stored in the database, so no persistent disk is needed.

## Run locally

```bash
npm install
cp .env.example .env        # optional for local work
npm run build
npm start                   # http://localhost:4010
```

For development with hot reload: `npm run dev` (Vite on :5180 proxies the API on :4010).

Without `DATABASE_URL`, an embedded Postgres (PGlite) is created in `./data`. The first start seeds the catalogue from the client's Facebook posts and creates the super admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` (defaults: `admin@gmmarmi.local` / `ChangeMe123!`). Change the password after the first login.

To reset local content, stop the server and delete the `data` folder.

## Deploy on Render

`render.yaml` defines a web service and a Postgres database. Set these environment variables on the service: `PUBLIC_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, SMTP settings and `NOTIFY_EMAIL`. Build: `npm install && npm run build`. Start: `npm start`.

## Structure

```
server/
  index.js     Express app, SEO tags per page, sitemap, robots, media serving
  public.js    Public API: site data, catalogue, enquiries, live chat, analytics
  admin.js     Admin API: auth, catalogue CRUD, media, enquiries CRM, chat, users, settings
  schema.sql   Database schema (created automatically)
  seed.js      First run content (from the client's posts; unknowns marked)
  mail.js      Email (SMTP now, any provider later)
  media.js     Image optimisation (WebP, three sizes)
src/
  pages/       Home, Materials, Product, Collections, Applications, Projects, About, Contact, FAQ, Legal, /link
  components/  Header, Footer, Reveal (animation system), Enquiry drawer and form, Chat widget, Cursor
  admin/       Dashboard, catalogue editors, drag and drop images, media library, enquiries, chat inbox, content, users
docs/PLAN.md   Research, information architecture, user journeys, data model, design and animation system
```

## Roles

| Role | Access |
| --- | --- |
| Super admin | Everything |
| Content manager | Products, categories, collections, brands, applications, projects, FAQs, media, website content |
| Sales / staff | Enquiries and live chat |

## Content still required from the client

Search the admin for the yellow ⚠ notes. In short: names for MY TOP Ref. 04 to 08, thickness and slab sizes, real marble, granite and quartz photography, opening hours, company history, legal details, project portfolio and the final domain.
