import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export type Lang = 'en' | 'el';

const S = {
  en: {
    group: 'Our Group', groupCompanies: 'Companies of the group', colours: 'Colours', groupTitle: 'One group, many spaces', visitSite: 'Visit website', formats: 'Formats', customSizes: 'Cut to any size, to fit your project.', materialsFor: 'Materials for this application', partners: 'Our partners', since: 'Since', founder: 'The founder', home: 'Home', materials: 'Materials', applications: 'Applications',
    about: 'About', contact: 'Contact', enquire: 'Enquire', faq: 'FAQ', menu: 'Menu', close: 'Close',
    explore: 'Explore', view: 'View', allMaterials: 'All materials', viewAll: 'View all', discover: 'Discover',
    requestInfo: 'Request information', requestQuote: 'Request a quote',
    overview: 'Overview', specifications: 'Specifications', gallery: 'Gallery', features: 'Highlights',
    material: 'Material', brand: 'Brand', finish: 'Finish', thickness: 'Thickness',
    dimensions: 'Slab dimensions', colour: 'Colour', category: 'Category',
    relatedMaterials: 'Related materials', usedIn: 'Applications',
    filters: 'Filter', clear: 'Clear', all: 'All', results: 'materials', noResults: 'No materials match these filters.',
    comingSoon: 'This section is being prepared. Contact us for the full range available in our showroom.',
   
    enquireMaterial: 'Enquire about this material',
    exclusive: 'Exclusive', texture3d: '3D Texture',
    phone: 'Phone', email: 'Email', address: 'Address', hours: 'Opening hours', directions: 'Get directions',
    visitShowroom: 'Visit the showroom', follow: 'Follow',
    // form
    fullName: 'Full name', company: 'Company', enquiryType: 'Enquiry type', product: 'Product or material',
    projectType: 'Project type', message: 'Message', attach: 'Attach plans or images', attachHint: 'PDF, JPG, PNG, Word or DWG, up to 10 MB',
    consent: 'I agree that G. M. Andreou Marmi Ltd may use my details to respond to this enquiry, as described in the',
    privacy: 'Privacy Policy', send: 'Send enquiry', sending: 'Sending', optional: 'optional', select: 'Select',
    thanksTitle: 'Thank you.', thanksBody: 'Your enquiry has been received. Our team will be in touch shortly.', reference: 'Reference',
    sendAnother: 'Send another enquiry', required: 'Please complete the required fields.',
    t_general: 'General enquiry', t_product: 'Product information', t_quote: 'Request a quote', t_project: 'Project',
    t_showroom: 'Showroom visit', t_architect: 'Architect or designer', t_other: 'Other',
    p_kitchen: 'Kitchen', p_bathroom: 'Bathroom', p_flooring: 'Flooring', p_walls: 'Walls and cladding', p_stairs: 'Staircase',
    p_commercial: 'Commercial or hospitality', p_outdoor: 'Outdoor', p_otherp: 'Other',
    // chat
    chatTitle: 'Talk to us', chatIntro: 'Ask about a material, a quote or a visit to our showroom.',
    chatOffline: 'Leave us a message', chatOfflineIntro: 'We are not online right now. Leave a message and we will reply by email.',
    chatStart: 'Start chat', chatPlaceholder: 'Write a message', chatSent: 'Thank you. We will reply by email shortly.',
    yourName: 'Your name', send2: 'Send', newChat: 'New conversation',
    // footer
    legal: 'Legal', terms: 'Terms & Conditions', cookies: 'Cookie Policy', developed: 'Developed & Designed by',
    rights: 'All rights reserved.', explore2: 'Explore', getInTouch: 'Get in touch',
    notFound: 'This page could not be found.', backHome: 'Back to home',
    faqTitle: 'Frequently asked questions', scroll: 'Scroll',
    fq_materials: 'Materials', fq_products: 'Products', fq_orders: 'Orders', fq_showroom: 'Showroom', fq_general: 'General',
  },
  el: {
    group: 'Ο Όμιλος', groupCompanies: 'Οι εταιρείες του ομίλου', colours: 'Χρώματα', groupTitle: 'Ένας όμιλος, πολλοί χώροι', visitSite: 'Επισκεφθείτε την ιστοσελίδα', formats: 'Διαστάσεις', customSizes: 'Κοπή σε οποιαδήποτε διάσταση, ανάλογα με το έργο σας.', materialsFor: 'Υλικά για αυτή την εφαρμογή', partners: 'Οι συνεργάτες μας', since: 'Από το', founder: 'Ο ιδρυτής', home: 'Αρχική', materials: 'Υλικά', applications: 'Εφαρμογές',
    about: 'Η Εταιρεία', contact: 'Επικοινωνία', enquire: 'Αίτημα', faq: 'Συχνές Ερωτήσεις', menu: 'Μενού', close: 'Κλείσιμο',
    explore: 'Δείτε', view: 'Προβολή', allMaterials: 'Όλα τα υλικά', viewAll: 'Δείτε όλα', discover: 'Ανακαλύψτε',
    requestInfo: 'Ζητήστε πληροφορίες', requestQuote: 'Ζητήστε προσφορά',
    overview: 'Περιγραφή', specifications: 'Προδιαγραφές', gallery: 'Γκαλερί', features: 'Χαρακτηριστικά',
    material: 'Υλικό', brand: 'Brand', finish: 'Φινίρισμα', thickness: 'Πάχος',
    dimensions: 'Διαστάσεις πλάκας', colour: 'Χρώμα', category: 'Κατηγορία',
    relatedMaterials: 'Σχετικά υλικά', usedIn: 'Εφαρμογές',
    filters: 'Φίλτρα', clear: 'Καθαρισμός', all: 'Όλα', results: 'υλικά', noResults: 'Δεν βρέθηκαν υλικά με αυτά τα φίλτρα.',
    comingSoon: 'Η ενότητα ετοιμάζεται. Επικοινωνήστε μαζί μας για όλη τη γκάμα του εκθεσιακού μας χώρου.',
   
    enquireMaterial: 'Ρωτήστε για αυτό το υλικό',
    exclusive: 'Αποκλειστικό', texture3d: '3D Texture',
    phone: 'Τηλέφωνο', email: 'Email', address: 'Διεύθυνση', hours: 'Ώρες λειτουργίας', directions: 'Οδηγίες',
    visitShowroom: 'Επισκεφθείτε μας', follow: 'Ακολουθήστε μας',
    fullName: 'Ονοματεπώνυμο', company: 'Εταιρεία', enquiryType: 'Είδος αιτήματος', product: 'Προϊόν ή υλικό',
    projectType: 'Είδος έργου', message: 'Μήνυμα', attach: 'Επισυνάψτε σχέδια ή φωτογραφίες', attachHint: 'PDF, JPG, PNG, Word ή DWG, έως 10 MB',
    consent: 'Συμφωνώ η G. M. Andreou Marmi Ltd να χρησιμοποιήσει τα στοιχεία μου για να απαντήσει στο αίτημα, όπως περιγράφεται στην',
    privacy: 'Πολιτική Απορρήτου', send: 'Αποστολή', sending: 'Αποστολή', optional: 'προαιρετικό', select: 'Επιλέξτε',
    thanksTitle: 'Ευχαριστούμε.', thanksBody: 'Λάβαμε το αίτημά σας. Η ομάδα μας θα επικοινωνήσει μαζί σας σύντομα.', reference: 'Αριθμός αναφοράς',
    sendAnother: 'Νέο αίτημα', required: 'Συμπληρώστε τα υποχρεωτικά πεδία.',
    t_general: 'Γενικό αίτημα', t_product: 'Πληροφορίες προϊόντος', t_quote: 'Αίτημα προσφοράς', t_project: 'Έργο',
    t_showroom: 'Επίσκεψη στον εκθεσιακό χώρο', t_architect: 'Αρχιτέκτονας ή σχεδιαστής', t_other: 'Άλλο',
    p_kitchen: 'Κουζίνα', p_bathroom: 'Μπάνιο', p_flooring: 'Δάπεδο', p_walls: 'Τοίχοι και επενδύσεις', p_stairs: 'Σκάλα',
    p_commercial: 'Επαγγελματικός χώρος ή φιλοξενία', p_outdoor: 'Εξωτερικός χώρος', p_otherp: 'Άλλο',
    chatTitle: 'Μιλήστε μαζί μας', chatIntro: 'Ρωτήστε για ένα υλικό, μια προσφορά ή μια επίσκεψη στον χώρο μας.',
    chatOffline: 'Αφήστε μας μήνυμα', chatOfflineIntro: 'Δεν είμαστε συνδεδεμένοι αυτή τη στιγμή. Αφήστε μήνυμα και θα σας απαντήσουμε με email.',
    chatStart: 'Έναρξη συνομιλίας', chatPlaceholder: 'Γράψτε ένα μήνυμα', chatSent: 'Ευχαριστούμε. Θα σας απαντήσουμε σύντομα με email.',
    yourName: 'Το όνομά σας', send2: 'Αποστολή', newChat: 'Νέα συνομιλία',
    legal: 'Νομικά', terms: 'Όροι Χρήσης', cookies: 'Πολιτική Cookies', developed: 'Developed & Designed by',
    rights: 'Με την επιφύλαξη παντός δικαιώματος.', explore2: 'Εξερευνήστε', getInTouch: 'Επικοινωνία',
    notFound: 'Η σελίδα δεν βρέθηκε.', backHome: 'Επιστροφή στην αρχική',
    faqTitle: 'Συχνές ερωτήσεις', scroll: 'Κύλιση',
    fq_materials: 'Υλικά', fq_products: 'Προϊόντα', fq_orders: 'Παραγγελίες', fq_showroom: 'Εκθεσιακός χώρος', fq_general: 'Γενικά',
  },
} as const;

export type Key = keyof typeof S.en;

type Ctx = { lang: Lang; t: (k: Key) => string; lp: (p: string) => string; tr: (o: any, f: string) => string };
const LangCtx = createContext<Ctx>(null as any);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const lang: Lang = pathname === '/el' || pathname.startsWith('/el/') ? 'el' : 'en';
  const value = useMemo<Ctx>(() => ({
    lang,
    t: (k) => S[lang][k] || S.en[k],
    lp: (p) => (lang === 'el' ? `/el${p === '/' ? '' : p}` : p),
    tr: (o, f) => (o ? o[`${f}_${lang}`] || o[`${f}_en`] || '' : ''),
  }), [lang]);
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

// path in the other language, preserving the current page
export function switchPath(pathname: string, to: Lang) {
  const base = pathname === '/el' ? '/' : pathname.startsWith('/el/') ? pathname.slice(3) : pathname;
  return to === 'el' ? `/el${base === '/' ? '' : base}` : base;
}

// Greek is the default language. The visitor's choice is remembered once they pick EN or GR.
const LANG_KEY = 'gm_lang';
export function saveLang(l: Lang) { try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } }
export function savedLang(): Lang | null { try { const v = localStorage.getItem(LANG_KEY); return v === 'en' || v === 'el' ? v : null; } catch { return null; } }
