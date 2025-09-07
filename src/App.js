// src/App.js
import React, { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import Footer from "./components/Footer";
import RouteSkin from "./components/RouteSkin";
import CosmicBackground from "./components/CosmicBackground";
import PageTransition from "./components/PageTransition";

import "./styles/cosmic.css";

/* Lazy-loaded pages (non-critical to first paint) */
const Facilities   = lazy(() => import("./components/Facilities"));
const TargetPage   = lazy(() => import("./components/TargetPage"));
const SignUpPage   = lazy(() => import("./components/SignUpPage"));
const DoorwayPage  = lazy(() => import("./components/DoorwayPage"));
const PlansPage    = lazy(() => import("./components/PlansPage"));
const SuccessPage  = lazy(() => import("./components/SuccessPage"));
const Testimonials = lazy(() => import("./components/Testimonials"));
const About        = lazy(() => import("./components/About"));
const Terms        = lazy(() => import("./components/Terms"));
const Contact      = lazy(() => import("./components/Contact"));
const PrivacyPage  = lazy(() => import("./components/PrivacyPage"));
const Dashboard    = lazy(() => import("./components/Dashboard")); // ✅ NEW
const WhyUs        = lazy(() => import("./components/WhyUs"));      // ✅ NEW (home section)

/* Scroll to top on route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/* Standard layout: shows Navbar + Footer */
function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-[var(--nav-h,64px)]" style={{ minHeight: "65vh" }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}

/* Bare layout: NO Navbar, NO Footer (signup, plans, target, thedoorway, success) */
function BareLayout({ children }) {
  useEffect(() => {
    // Remove global nav offset while nav is hidden
    document.body.classList.add("no-nav");
    return () => document.body.classList.remove("no-nav");
  }, []);

  return (
    <main style={{ minHeight: "65vh" }}>
      <PageTransition>{children}</PageTransition>
    </main>
  );
}

function AppRoot() {
  // keep dark mode tokens + nuke legacy plan key once
  useEffect(() => {
    document.documentElement.classList.add("dark");
    try {
      // Remove legacy key so old browsers don't leak a plan to new users
      localStorage.removeItem("cf_selected_plan");
    } catch {}
    return () => document.documentElement.classList.remove("dark");
  }, []);

  return (
    <>
      <RouteSkin />
      <CosmicBackground />
      <ScrollToTop />

      {/* Suspense wraps all lazy content with a lightweight fallback */}
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <Routes>
          {/* Home */}
          <Route
            path="/"
            element={
              <Layout>
                <LandingPage />
                <WhyUs />         {/* ✅ Inserted right after LandingPage */}
                <Facilities />
                <Testimonials />
              </Layout>
            }
          />

          {/* Dashboard (uses Navbar + Footer) */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />

          {/* Info pages */}
          <Route
            path="/about"
            element={
              <Layout>
                <About />
              </Layout>
            }
          />
          <Route
            path="/terms"
            element={
              <Layout>
                <Terms />
              </Layout>
            }
          />
          <Route
            path="/privacy"
            element={
              <Layout>
                <PrivacyPage />
              </Layout>
            }
          />
          <Route
            path="/contact"
            element={
              <Layout>
                <Contact />
              </Layout>
            }
          />

          {/* 🚫 No Navbar/No Footer pages */}
          <Route
            path="/signup"
            element={
              <BareLayout>
                <SignUpPage />
              </BareLayout>
            }
          />
          <Route
            path="/plans"
            element={
              <BareLayout>
                <PlansPage />
              </BareLayout>
            }
          />
          <Route
            path="/target"
            element={
              <BareLayout>
                <TargetPage />
              </BareLayout>
            }
          />
          <Route
            path="/thedoorway"
            element={
              <BareLayout>
                <DoorwayPage />
              </BareLayout>
            }
          />
          <Route
            path="/checkout/success"
            element={
              <BareLayout>
                <SuccessPage />
              </BareLayout>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoot />
    </Router>
  );
}
