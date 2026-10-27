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
const wrap = (inner) => `<div style="font-family:Georgia,serif;background:#F6F2EC;padding:32px"><div style="max-width:560px;margin:auto;background:#fff;padding:32px;border:1px solid #E7E0D5">
<div style="font-size:12px;letter-spacing:.25em;color:#9A7A55">G. M. ANDREOU MARMI LTD</div>${inner}
<p style="font-size:12px;color:#6F675F;margin-top:32px">Livadia Industrial Area, Kellia, Livadia, Larnaca 7060, Cyprus · +357 24 667984</p></div></div>`;

export function customerConfirmation(e) {
  const el = e.lang === 'el';
  return {
    subject: el ? 'Ευχαριστούμε που επικοινωνήσατε με την GM Andreou Marmi' : 'Thank you for contacting GM Andreou Marmi',
    html: wrap(`<h1 style="font-weight:400;font-size:26px;color:#1D1B19">${el ? 'Λάβαμε το μήνυμά σας' : 'We have received your enquiry'}</h1>
<p style="color:#3A2D24;line-height:1.6">${el ? `Αγαπητέ/ή ${esc(e.name)}, ευχαριστούμε για το ενδιαφέρον σας. Ένας συνεργάτης μας θα επικοινωνήσει μαζί σας σύντομα.` : `Dear ${esc(e.name)}, thank you for your interest. A member of our team will be in touch shortly.`}</p>
<p style="color:#6F675F">${el ? 'Αριθμός αναφοράς' : 'Reference'}: <b>${esc(e.ref)}</b>${e.product_name ? `<br>${el ? 'Υλικό' : 'Material'}: ${esc(e.product_name)}` : ''}</p>`),
  };
}

export function adminNotification(e, adminUrl) {
  const row = (k, v) => (v ? `<tr><td style="color:#6F675F;padding:4px 12px 4px 0">${k}</td><td>${esc(v)}</td></tr>` : '');
  return {
    subject: `New website enquiry ${e.ref}${e.product_name ? ` · ${e.product_name}` : ''}`,
    html: wrap(`<h1 style="font-weight:400;font-size:24px">New website enquiry</h1><table style="font-size:14px">
${row('Reference', e.ref)}${row('Name', e.name)}${row('Company', e.company)}${row('Email', e.email)}${row('Phone', e.phone)}
${row('Type', e.enquiry_type)}${row('Product', e.product_name)}${row('Project', e.project_type)}${row('Attachment', e.attachment_name)}</table>
<p style="white-space:pre-wrap;line-height:1.6">${esc(e.message)}</p><p><a href="${adminUrl}" style="color:#9A7A55">Open in admin</a></p>`),
  };
}
