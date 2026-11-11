import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LangProvider, savedLang, useLang } from './lib/i18n';
import { SiteProvider } from './lib/site';
import { ScrollTrigger, scrollTop, startSmoothScroll, stopSmoothScroll } from './lib/motion';
import { track } from './lib/api';
import Header from './components/Header';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import ChatWidget from './components/ChatWidget';
import { EnquiryProvider } from './components/EnquiryDrawer';
import { Loading, NotFoundBlock } from './components/ui';
import Home from './pages/Home';
import Materials from './pages/Materials';
import Product from './pages/Product';
import { DetailPage, ListPage } from './pages/Sections';
import { About, Contact, Faq, Group, Legal, LinkPage } from './pages/Info';

const Admin = lazy(() => import('./admin/Admin'));

function Go({ to }: { to: string }) {
  const { lp } = useLang();
  return <Navigate to={lp(to)} replace />;
}

function PublicRoutes() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="materials" element={<Materials />} />
      <Route path="materials/:cat" element={<Materials />} />
      <Route path="materials/:cat/:slug" element={<Product />} />
      {/* Collections and Projects were removed, old links go to Materials and Applications */}
      <Route path="collections/*" element={<Go to="/materials" />} />
      <Route path="applications" element={<ListPage />} />
      <Route path="applications/:slug" element={<DetailPage />} />
      <Route path="projects/*" element={<Go to="/applications" />} />
      <Route path="about" element={<About />} />
      <Route path="group" element={<Group />} />
      <Route path="contact" element={<Contact />} />
      <Route path="faq" element={<Faq />} />
      <Route path="privacy" element={<Legal k="privacy" />} />
      <Route path="cookies" element={<Legal k="cookies" />} />
      <Route path="terms" element={<Legal k="terms" />} />
      <Route path="link" element={<LinkPage />} />
      <Route path="*" element={<NotFoundBlock />} />
    </Routes>
  );
}

function Site() {
  const { pathname } = useLocation();
  const bare = /\/link$/.test(pathname);
  useEffect(() => { startSmoothScroll(); return () => stopSmoothScroll(); }, []);
  useEffect(() => {
    scrollTop();
    track('page_view');
    const id = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(id);
  }, [pathname]);
  return (
    <LangProvider>
      <SiteProvider>
        <EnquiryProvider>
          {!bare && <Header />}
          <main key={pathname} className="page-in min-h-screen">
            <Routes>
              <Route path="/el/*" element={<PublicRoutes />} />
              <Route path="/*" element={<PublicRoutes />} />
            </Routes>
          </main>
          <div key={`c${pathname}`} className="curtain pointer-events-none fixed inset-0 z-[80] bg-charcoal" aria-hidden />
          {!bare && <Footer />}
          {!bare && <ChatWidget />}
          <Cursor />
        </EnquiryProvider>
      </SiteProvider>
    </LangProvider>
  );
}

export default function App() {
  const { pathname, search } = useLocation();
  if (pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<Loading />}>
        <Admin />
      </Suspense>
    );
  }
  // the homepage opens in Greek unless the visitor chose English before
  if (pathname === '/' && savedLang() !== 'en') return <Navigate to={`/el${search}`} replace />;
  return <Site />;
}
