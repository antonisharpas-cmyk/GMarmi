// Email. Uses SMTP when SMTP_HOST is set; otherwise logs. Swap transport for SES or another provider later.
import nodemailer from 'nodemailer';

let transport = null;
function t() {
  if (transport !== null) return transport;
  transport = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
    : false;
  return transport;
}

export async function sendMail({ to, subject, html, attachments, replyTo }) {
  const tr = t();
  if (!tr) { console.log(`[mail] (not sent, SMTP not configured) to=${to} subject="${subject}"`); return false; }
  try {
    await tr.sendMail({ from: process.env.MAIL_FROM || 'GM Andreou Marmi <no-reply@localhost>', to, subject, html, attachments, replyTo });
    return true;
  } catch (e) { console.error('[mail] failed', e.message); return false; }
}

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const wrap = (inner, lang = 'el') => `<div style="font-family:Georgia,serif;background:#F6F2EC;padding:32px"><div style="max-width:560px;margin:auto;background:#fff;padding:32px;border:1px solid #E7E0D5">
<div style="font-size:12px;letter-spacing:.25em;color:#9A7A55">G. M. ANDREOU MARMI LTD</div>${inner}
<p style="font-size:12px;color:#6F675F;margin-top:32px">${lang === 'en' ? 'Livadia Industrial Area, Kellia, Livadia, Larnaca 7060, Cyprus' : 'Βιομηχανική Περιοχή Λιβαδιών, Κελλιά, Λιβάδια, Λάρνακα 7060, Κύπρος'} · +357 24 667984</p></div></div>`;

export function customerConfirmation(e) {
  const el = e.lang === 'el';
  return {
    subject: el ? 'Ευχαριστούμε που επικοινωνήσατε με την GM Andreou Marmi' : 'Thank you for contacting GM Andreou Marmi',
    html: wrap(`<h1 style="font-weight:400;font-size:26px;color:#1D1B19">${el ? 'Λάβαμε το μήνυμά σας' : 'We have received your enquiry'}</h1>
<p style="color:#3A2D24;line-height:1.6">${el ? `Αγαπητέ/ή ${esc(e.name)}, ευχαριστούμε για το ενδιαφέρον σας. Ένας συνεργάτης μας θα επικοινωνήσει μαζί σας σύντομα. Για κάτι επείγον, καλέστε μας στο +357 24 667984.` : `Dear ${esc(e.name)}, thank you for your interest. A member of our team will be in touch shortly. For anything urgent, call us on +357 24 667984.`}</p>
<p style="color:#6F675F">${el ? 'Αριθμός αναφοράς' : 'Reference'}: <b>${esc(e.ref)}</b>${e.product_name ? `<br>${el ? 'Επιφάνειες' : 'Surfaces'}: ${esc(e.product_name)}` : ''}${e.project_type ? `<br>${el ? 'Εφαρμογές' : 'Applications'}: ${esc(e.project_type)}` : ''}</p>`, el ? 'el' : 'en'),
  };
}

const TYPE_EL = { general: 'Γενικό αίτημα', product: 'Πληροφορίες προϊόντος', quote: 'Αίτημα προσφοράς', project: 'Έργο', showroom: 'Επίσκεψη στον εκθεσιακό χώρο', architect: 'Αρχιτέκτονας ή σχεδιαστής', other: 'Άλλο' };

export function adminNotification(e, adminUrl) {
  const row = (k, v) => (v ? `<tr><td style="color:#6F675F;padding:4px 12px 4px 0">${k}</td><td>${esc(v)}</td></tr>` : '');
  return {
    subject: `Νέο αίτημα από την ιστοσελίδα ${e.ref}${e.product_name ? ` · ${e.product_name}` : ''}`,
    html: wrap(`<h1 style="font-weight:400;font-size:24px">Νέο αίτημα από την ιστοσελίδα</h1><table style="font-size:14px">
${row('Αριθμός αναφοράς', e.ref)}${row('Όνομα', e.name)}${row('Εταιρεία', e.company)}${row('Email', e.email)}${row('Τηλέφωνο', e.phone)}
${row('Είδος αιτήματος', TYPE_EL[e.enquiry_type] || e.enquiry_type)}${row('Επιφάνειες', e.product_name)}${row('Εφαρμογές', e.project_type)}${row('Συνημμένο', e.attachment_name)}${row('Γλώσσα', e.lang === 'en' ? 'Αγγλικά' : 'Ελληνικά')}</table>
<p style="white-space:pre-wrap;line-height:1.6;border-left:3px solid #9A7A55;padding-left:12px">${esc(e.message)}</p>
<p><a href="${adminUrl}" style="color:#9A7A55">Άνοιγμα στη διαχείριση</a> · Πατήστε Απάντηση για να γράψετε απευθείας στον πελάτη.</p>`),
  };
}

// live chat: tells the company that a visitor wrote, so nobody is left waiting
export function chatNotification(c, body, adminUrl, first) {
  const row = (k, v) => (v ? `<tr><td style="color:#6F675F;padding:4px 12px 4px 0">${k}</td><td>${esc(v)}</td></tr>` : '');
  return {
    subject: `${first ? 'Νέα συνομιλία στο live chat' : 'Νέο μήνυμα στο live chat'} · ${c.name || 'Επισκέπτης'}`,
    html: wrap(`<h1 style="font-weight:400;font-size:24px">${first ? 'Ένας επισκέπτης ξεκίνησε συνομιλία' : 'Νέο μήνυμα σε συνομιλία'}</h1><table style="font-size:14px">
${row('Όνομα', c.name)}${row('Email', c.email)}${row('Τηλέφωνο', c.phone)}${row('Σελίδα', c.page)}${row('Γλώσσα', c.lang === 'en' ? 'Αγγλικά' : 'Ελληνικά')}</table>
<p style="white-space:pre-wrap;line-height:1.6;border-left:3px solid #9A7A55;padding-left:12px">${esc(body)}</p>
<p><a href="${adminUrl}" style="color:#9A7A55">Απάντηση στη διαχείριση</a> · Ο επισκέπτης βλέπει την απάντησή σας στο chat της ιστοσελίδας.</p>`),
  };
}
