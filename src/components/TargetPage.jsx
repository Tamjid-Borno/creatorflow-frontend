import React, { useEffect, useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { useNavigate } from "react-router-dom";
import "./TargetPage.css";
import NicheArt from "../assets/creator-cosmic.svg";

// Firebase
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

/**
 * Keep your existing arrays or import them:
 *   - niches
 *   - subCategories
 *   - followerCounts
 *   - scriptTones
 * Example:
 * import { niches, subCategories, followerCounts, scriptTones } from "../constants/targetOptions";
 */

const TargetPage = () => {
  const navigate = useNavigate();

  // Live credits from Firestore
  const [credits, setCredits] = useState(null);

  // Form state
  const [loading, setLoading] = useState(false);
  const [niche, setNiche] = useState(null);
  const [sub, setSub] = useState(null);
  const [followers, setFollowers] = useState(null);
  const [tone, setTone] = useState(null);
  const [specific, setSpecific] = useState("");

  // Enable Continue only when fields + credits are good
  const canContinue = useMemo(() => {
    const hasCredits = (credits ?? 0) > 0;
    return niche && sub && followers && tone && !loading && hasCredits;
  }, [niche, sub, followers, tone, loading, credits]);

  // Auth + live credits
  useEffect(() => {
    const offAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/signup", { replace: true });
        return;
      }
      const userRef = doc(db, "users", user.uid);
      const offSnap = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCredits(typeof data.credits === "number" ? data.credits : 0);
        } else {
          setCredits(0);
        }
      });
      return offSnap;
    });
    return () => offAuth();
  }, [navigate]);

  // Reset lower fields on change
  useEffect(() => {
    setSub(null);
    setFollowers(null);
    setTone(null);
  }, [niche]);
  useEffect(() => {
    setFollowers(null);
    setTone(null);
  }, [sub]);
  useEffect(() => setTone(null), [followers]);

  const handleBack = () => navigate("/");

  const handleSubmit = async () => {
    if (!canContinue) return;
    setLoading(true);
    try {
      navigate("/thedoorway", {
        state: {
          niche: niche.name,
          subCategory: sub.name,
          followerCount: followers.name,
          tone: tone.name,
          moreSpecific: specific.trim(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="target">
      {/* subtle starfield + vignette */}
      <div className="target__bg" aria-hidden="true" />

      <section className="target__card" role="form" aria-labelledby="target-title">
        <header className="target__cardHead">
          <h1 id="target-title" className="target__title">
            Pick your preferred niche
          </h1>

          {/* live credits pill */}
          <div className="target__credits" title="Available credits">
            <span className="target__creditsDot" aria-hidden="true" />
            <span className="target__creditsLabel">Credits</span>
            <span className="target__creditsValue">
              {credits === null ? "…" : credits}
            </span>
          </div>
        </header>

        <p className="target__subtitle">
          We’ll tailor hooks, structure, and tone to your audience.
        </p>

        {/* 2-column: form (2fr) | art (1fr) */}
        <div className="target__cardInner">
          {/* LEFT — FORM */}
          <div className="target__form">
            <div className="target__fields">
              <label className="target__label">
                Niche
                <Dropdown
                  value={niche}
                  onChange={(e) => setNiche(e.value)}
                  options={niches}
                  optionLabel="name"
                  placeholder="Select a niche"
                  className="p-dropdown target__dd"
                  aria-label="Select a niche"
                />
              </label>

              <label className="target__label" aria-disabled={!niche}>
                Subcategory
                <Dropdown
                  value={sub}
                  onChange={(e) => setSub(e.value)}
                  options={niche ? subCategories[niche.code] : []}
                  optionLabel="name"
                  placeholder={niche ? "Select a subcategory" : "Choose niche first"}
                  className="p-dropdown target__dd"
                  disabled={!niche}
                  aria-label="Select a subcategory"
                />
              </label>

              <label className="target__label" aria-disabled={!sub}>
                Follower count
                <Dropdown
                  value={followers}
                  onChange={(e) => setFollowers(e.value)}
                  options={followerCounts}
                  optionLabel="name"
                  placeholder={sub ? "Select follower range" : "Choose subcategory first"}
                  className="p-dropdown target__dd"
                  disabled={!sub}
                  aria-label="Select follower count"
                />
              </label>

              <label className="target__label" aria-disabled={!followers}>
                Script tone
                <Dropdown
                  value={tone}
                  onChange={(e) => setTone(e.value)}
                  options={scriptTones}
                  optionLabel="name"
                  placeholder={followers ? "Select a tone" : "Choose follower range first"}
                  className="p-dropdown target__dd"
                  disabled={!followers}
                  aria-label="Select script tone"
                />
              </label>

              <label className="target__label target__label--full">
                More specifically (optional)
                <input
                  type="text"
                  maxLength={120}
                  value={specific}
                  onChange={(e) => setSpecific(e.target.value)}
                  className="target__input"
                  placeholder="e.g., iPhone 16 camera test"
                  aria-label="Add a specific topic (optional)"
                />
              </label>
            </div>

            {/* sticky actions on mobile, inline on desktop */}
            <div className="target__actions">
              <button className="btn btn--ghost" onClick={handleBack}>
                Back
              </button>
              <button
                className={`btn btn--primary ${!canContinue ? "is-disabled" : ""}`}
                onClick={handleSubmit}
                disabled={!canContinue}
                aria-disabled={!canContinue}
              >
                {loading ? "Generating…" : "Continue"}
              </button>
            </div>

            {!tone && (
              <p className="target__hint">Choose a tone to continue.</p>
            )}
            {credits === 0 && (
              <p className="target__hint">
                You’re out of credits — upgrade your plan to continue.
              </p>
            )}
          </div>

          {/* RIGHT — ART */}
          <aside className="target__artCol" aria-hidden="true">
            <div className="target__artWrap">
              <img
                src={NicheArt}
                alt=""
                className="target__artImg"
                loading="lazy"
                decoding="async"
              />
              <div className="target__artGlow" />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default TargetPage;


// === NICHES (includes your originals + script-heavy additions) ===
const niches = [
  { name: "Instagram Growth", code: "INSTA" },
  { name: "AI Tools", code: "AI" },
  { name: "Fitness", code: "FIT" },
  { name: "Fashion & Aesthetic", code: "FAS" },
  { name: "Glow-up / Beauty", code: "BEAUTY" },
  { name: "Dark Psychology", code: "DPSY" },              // framed as recognize/defend
  { name: "Dating & Relationships", code: "LOVE" },
  { name: "Money Mindset", code: "MONEY" },
  { name: "Side Hustles", code: "HUSTLE" },
  { name: "Freelancing", code: "FREELANCE" },
  { name: "Personal Branding", code: "BRAND" },
  { name: "Faith & Mindfulness", code: "FAITH" },
  { name: "Content Creation Tips", code: "CONTENT" },
  { name: "Digital Products", code: "DIGI" },
  { name: "E-commerce / Dropshipping", code: "ECOM" },
  { name: "Tech Reviews / Gadgets", code: "TECH" },

  // Script-heavy, reels-native additions
  { name: "UGC Ads & Product Demos", code: "UGC" },
  { name: "Business & Marketing", code: "BIZ" },
  { name: "Personal Finance & Investing", code: "FIN" },
  { name: "Real Estate", code: "RE" },
  { name: "Health & Nutrition", code: "HEALTH" },
  { name: "Education & Study Skills", code: "STUDY" },
  { name: "Career & Job Search", code: "CAREER" },
  { name: "Coding & Developer Tips", code: "CODE" },
  { name: "SaaS & App Tutorials", code: "SAAS" },
  { name: "Parenting & Family Advice", code: "PARENT" },
  { name: "Motivation & Mindset (Scripted)", code: "MOTIV" },
  { name: "Travel Guides (Voiceover)", code: "TRAVEL" },
];

// === SUBCATEGORIES (15 per niche; all are script-heavy formats) ===
const subCategories = {
  INSTA: [
    { name: "Hook Vault (0–3s)", code: "HOOKS" },
    { name: "Caption Frameworks", code: "CAPTION" },
    { name: "Retention Tactics", code: "RETENT" },
    { name: "CTA Variations", code: "CTA" },
    { name: "Hashtag Scripts", code: "HASHTAG" },
    { name: "Algorithm Myths Debunk", code: "ALGOMYTH" },
    { name: "Content Pillar Explainers", code: "PILLAR" },
    { name: "Green-Screen Explainers", code: "GREEN" },
    { name: "Collab Pitch Scripts", code: "COLLAB" },
    { name: "Giveaway Announcements", code: "GIVE" },
    { name: "Posting Cadence VO", code: "CADENCE" },
    { name: "Story-to-Reel Bridges", code: "BRIDGE" },
    { name: "Trend Adapt Scripts", code: "TRENDAPT" },
    { name: "Series Intro/Outro", code: "SERIES" },
    { name: "Comment Reply Scripts", code: "REPLY" },
  ],
  AI: [
    { name: "Prompt Frameworks", code: "PROMPTS" },
    { name: "Tool Roundups (Top 5)", code: "TOOL5" },
    { name: "Workflow Automation VO", code: "FLOW" },
    { name: "Edit with AI How-To", code: "AIEDIT" },
    { name: "Research with AI", code: "AIRESEARCH" },
    { name: "AI for Hooks/Captions", code: "AIHOOKS" },
    { name: "Comparison: AI vs Human", code: "AIVHUM" },
    { name: "AI Mistakes to Avoid", code: "AIOOPS" },
    { name: "Ethical Use Disclaimer", code: "ETHICS" },
    { name: "Case Studies (Before/After)", code: "CASEAI" },
    { name: "Prompt Teardowns", code: "TEARDOWN" },
    { name: "Voiceover Scripts (AI VO)", code: "AIVO" },
    { name: "AI Productivity Stack", code: "STACK" },
    { name: "Niche AI Ideas", code: "NICHAI" },
    { name: "Weekly AI Trends VO", code: "AITREND" },
  ],
  FIT: [
    { name: "Fat Loss Myths Debunk", code: "FATMYTH" },
    { name: "Beginner Plan Explainer", code: "BEGIN" },
    { name: "Gym Motivation VO", code: "GYMVO" },
    { name: "Calorie Deficit Script", code: "CALDEF" },
    { name: "Meal Prep VO", code: "MEAL" },
    { name: "Home Workout Guides", code: "HOMEWK" },
    { name: "Form Cues (Do/Don’t)", code: "FORM" },
    { name: "Recovery & Mobility", code: "RECOV" },
    { name: "Supplements 101", code: "SUPP" },
    { name: "Plateau Fixes", code: "PLATEAU" },
    { name: "Cut vs Bulk Explainer", code: "CUTBULK" },
    { name: "Steps/NEAT Scripts", code: "NEAT" },
    { name: "Fitness Habit Systems", code: "HABIT" },
    { name: "Mind-Muscle Tips", code: "MMCON" },
    { name: "Transformation Narrative", code: "TRANS" },
  ],
  FAS: [
    { name: "Outfit Hook Scripts", code: "OUTFIT" },
    { name: "Streetwear Explainers", code: "STREET" },
    { name: "Minimalist Aesthetic VO", code: "MIN" },
    { name: "Budget Fits Guides", code: "BUDG" },
    { name: "Sneaker Story VO", code: "SHOE" },
    { name: "Seasonal Lookbooks", code: "SEAS" },
    { name: "Accessories Breakdown", code: "ACC" },
    { name: "Body Type Styling", code: "BODY" },
    { name: "Color Theory Scripts", code: "COLOR" },
    { name: "Wardrobe Capsule VO", code: "CAPS" },
    { name: "Outfit Mistakes", code: "MIST" },
    { name: "Thrift Flip Narratives", code: "THRIFT" },
    { name: "Trend vs Timeless", code: "TRENDTIME" },
    { name: "Fit Check VO", code: "FITCHK" },
    { name: "Get Ready With Me (GRWM)", code: "GRWM" },
  ],
  BEAUTY: [
    { name: "Skincare Routine VO", code: "SKIN" },
    { name: "Makeup Hack Scripts", code: "MAKE" },
    { name: "Haircare Tutorials", code: "HAIR" },
    { name: "Budget Beauty Picks", code: "BUDG" },
    { name: "Ingredient 101 (e.g., AHA)", code: "INGR" },
    { name: "Before/After Narratives", code: "BEFAF" },
    { name: "Common Mistakes", code: "MIST" },
    { name: "Product Review VO", code: "REV" },
    { name: "Routine for Skin Types", code: "SKINTYPE" },
    { name: "Confidence Hooks", code: "CONF" },
    { name: "Fragrance Stories", code: "SCENT" },
    { name: "Derm Tips Breakdown", code: "DERM" },
    { name: "Dupes & Saves", code: "DUPE" },
    { name: "Daily Reset VO", code: "RESET" },
    { name: "Minimal Routine Scripts", code: "MINR" },
  ],
  DPSY: [ // strictly framed as awareness/defense
    { name: "Recognize Manipulation", code: "RECOG" },
    { name: "Gaslighting—Defense", code: "GAS" },
    { name: "Boundary Scripts", code: "BOUND" },
    { name: "Persuasion Tactics (Ethical)", code: "PERS" },
    { name: "Power Dynamics 101", code: "POWER" },
    { name: "Red Flags VO", code: "REDF" },
    { name: "Body Language Basics", code: "BODY" },
    { name: "De-escalation Scripts", code: "DEESC" },
    { name: "Trust-building Signals", code: "TRUST" },
    { name: "Narcissism Awareness", code: "NARC" },
    { name: "Love Bombing Signs", code: "LOVEB" },
    { name: "Grey Rock How-To", code: "GREY" },
    { name: "Guilt Trips—Counter", code: "GUILT" },
    { name: "Healthy Communication", code: "HEALTHCOM" },
    { name: "Self-Respect Scripts", code: "SELFRES" },
  ],
  LOVE: [
    { name: "Attraction Hooks", code: "ATTR" },
    { name: "First Date Scripts", code: "DATE1" },
    { name: "Text/DM Openers", code: "DM" },
    { name: "Green/Red Flags", code: "FLAGS" },
    { name: "Attachment Styles VO", code: "ATTACH" },
    { name: "Conflict Resolution", code: "CONFL" },
    { name: "Boundaries Scripts", code: "BOUND" },
    { name: "Breakup Healing VO", code: "HEAL" },
    { name: "Love Languages VO", code: "LANG" },
    { name: "Masculine/Feminine Energy", code: "ENERGY" },
    { name: "Date Ideas VO", code: "IDEAS" },
    { name: "Self-Worth Scripts", code: "WORTH" },
    { name: "Long-Distance Tips", code: "LDR" },
    { name: "Moving On Narratives", code: "MOVEON" },
    { name: "Values Alignment", code: "VALUES" },
  ],
  MONEY: [
    { name: "Habits of the Wealthy", code: "HABIT" },
    { name: "Scarcity→Abundance", code: "SHIFT" },
    { name: "Affirmation VO", code: "AFF" },
    { name: "Budgeting Systems", code: "BUDG" },
    { name: "Saving Challenges", code: "SAVE" },
    { name: "Debt Payoff VO", code: "DEBT" },
    { name: "Passive Income Hooks", code: "PASS" },
    { name: "Money Myths Debunk", code: "MYTH" },
    { name: "Mindset Reframes", code: "REFR" },
    { name: "High-ROI Skills", code: "SKILL" },
    { name: "Emergency Funds 101", code: "EFUND" },
    { name: "Frugality Scripts", code: "FRUG" },
    { name: "Investing Philosophy", code: "PHIL" },
    { name: "Lifestyle Creep Fix", code: "CREEP" },
    { name: "Financial Goal VO", code: "GOAL" },
  ],
  HUSTLE: [
    { name: "$1k/Month Frameworks", code: "1K" },
    { name: "Weekend Hustles", code: "WKND" },
    { name: "No-Skill Hustles", code: "NSKILL" },
    { name: "Affiliate Hustles", code: "AFF" },
    { name: "Print-on-Demand VO", code: "POD" },
    { name: "Etsy/Template Scripts", code: "ETSY" },
    { name: "Content→Cashflow", code: "C2C" },
    { name: "Student/Teen Ideas", code: "TEEN" },
    { name: "Freelance Faststart", code: "FFS" },
    { name: "Automation Hustles", code: "AUTO" },
    { name: "Micro-service Offers", code: "MICRO" },
    { name: "Time Boxing Systems", code: "TBOX" },
    { name: "Price Your Offer", code: "PRICE" },
    { name: "Common Pitfalls", code: "PIT" },
    { name: "Scale Levers", code: "SCALE" },
  ],
  FREELANCE: [
    { name: "Cold Email Hooks", code: "COLD" },
    { name: "Upwork/Fiverr Scripts", code: "PLAT" },
    { name: "Portfolio VO", code: "PORT" },
    { name: "Discovery Call Script", code: "DISC" },
    { name: "Scope & Pricing", code: "SCOPE" },
    { name: "Proposal Frameworks", code: "PROP" },
    { name: "Client Onboarding VO", code: "ONB" },
    { name: "Retention Playbook", code: "RET" },
    { name: "Testimonial Requests", code: "TESTI" },
    { name: "Red Flag Clients", code: "RFC" },
    { name: "NICHE Pick Scripts", code: "NICHE" },
    { name: "Deliverable Walkthrough", code: "DELV" },
    { name: "Raise Your Rates", code: "RATE" },
    { name: "Upsell/Cross-sell", code: "UPSELL" },
    { name: "Freelance Mistakes", code: "MIST" },
  ],
  BRAND: [
    { name: "Founder Story VO", code: "FOUND" },
    { name: "Origin Story Hooks", code: "ORIGIN" },
    { name: "Mission & Values", code: "MISSION" },
    { name: "Authenticity Scripts", code: "AUTH" },
    { name: "Trust Builders", code: "TRUST" },
    { name: "Consistency Systems", code: "CONSIST" },
    { name: "Build-in-Public", code: "BIP" },
    { name: "Audience Insights", code: "INSIGHT" },
    { name: "Positioning Scripts", code: "POSITION" },
    { name: "Personal POV Hot-takes", code: "POV" },
    { name: "Behind-the-Scenes VO", code: "BTS" },
    { name: "Brand Do/Don’t", code: "DODONT" },
    { name: "Community Calls-to-Action", code: "COMMCTA" },
    { name: "Niche Resonance Tests", code: "NRT" },
    { name: "Rebrand Narrative", code: "REBRAND" },
  ],
  FAITH: [
    { name: "Mindful Routine VO", code: "MIND" },
    { name: "Gratitude Scripts", code: "GRAT" },
    { name: "Discipline Systems", code: "DISC" },
    { name: "Business Ethics", code: "ETHIC" },
    { name: "Clean Influence Online", code: "CLEAN" },
    { name: "Intentions & Actions", code: "INTENT" },
    { name: "Patience Narratives", code: "PATIENCE" },
    { name: "Charity/Service VO", code: "SERVE" },
    { name: "Faith in Work", code: "FAITHWORK" },
    { name: "Temptation Boundaries", code: "TEMPT" },
    { name: "Community Support", code: "UMMAH" },
    { name: "Reflection Prompts", code: "REFLECT" },
    { name: "Sunnah Lifestyle", code: "SUNNAH" },
    { name: "Forgiveness Scripts", code: "FORGIVE" },
    { name: "Hope & Resilience", code: "HOPE" },
  ],
  CONTENT: [
    { name: "High-Retention Hooks", code: "HOOK" },
    { name: "Scroll-Stop Intros", code: "INTRO" },
    { name: "Pattern Interrupts", code: "PATINT" },
    { name: "Story Arcs in 30s", code: "ARC30" },
    { name: "Tutorial 3-Step", code: "TUT3" },
    { name: "Listicle VO (Top 5)", code: "LIST5" },
    { name: "Myth vs Fact", code: "MVF" },
    { name: "Comment Reply VO", code: "REPLY" },
    { name: "Green-Screen News", code: "NEWS" },
    { name: "Thread→Reel Scripts", code: "T2R" },
    { name: "Carousel→Reel VO", code: "C2R" },
    { name: "FAQ Rapid-Fire", code: "FAQ" },
    { name: "Series Intro/Outro", code: "SERIES" },
    { name: "Challenge Kickoff", code: "CHALL" },
    { name: "Call-to-Save/Share", code: "SAVE" },
  ],
  DIGI: [
    { name: "Template Promo VO", code: "TPL" },
    { name: "Ebook Launch Hooks", code: "EBOOK" },
    { name: "Lead Magnet Pitch", code: "LEAD" },
    { name: "Funnel Explainer", code: "FUNNEL" },
    { name: "Tripwire Offers", code: "TRIP" },
    { name: "Course Module Tease", code: "COURSE" },
    { name: "Upsell Script", code: "UPSELL" },
    { name: "Bundle Pitch", code: "BUNDLE" },
    { name: "Pricing Psychology", code: "PRICE" },
    { name: "Scarcity/Deadline", code: "SCARC" },
    { name: "Customer Wins VO", code: "WINS" },
    { name: "Refund Policy VO", code: "REFUND" },
    { name: "Competitor Contrast", code: "CCOMP" },
    { name: "Roadmap/Update", code: "ROAD" },
    { name: "Affiliate Pitch VO", code: "AFF" },
  ],
  ECOM: [
    { name: "Winning Product Pitch", code: "WIN" },
    { name: "UGC Ad Script", code: "UGCAD" },
    { name: "TikTok Ad Hook", code: "TIKAD" },
    { name: "Landing Page VO", code: "LP" },
    { name: "Offer Stack VO", code: "STACK" },
    { name: "Objection Busting", code: "OBJ" },
    { name: "FAQ/Support VO", code: "SUP" },
    { name: "Shipping/Supplier VO", code: "SHIP" },
    { name: "A/B Test Ideas", code: "AB" },
    { name: "Upsell/Cross-sell", code: "UPX" },
    { name: "Review/Testimonial VO", code: "REV" },
    { name: "Bundle/BOGO Pitch", code: "BOGO" },
    { name: "Cart Recovery Script", code: "CART" },
    { name: "UGC Brief for Creators", code: "BRIEF" },
    { name: "Compliance Disclaimers", code: "COMP" },
  ],
  TECH: [
    { name: "Gadget Review VO", code: "REVIEW" },
    { name: "Top 5 Apps Today", code: "APPS" },
    { name: "Setup/Lighting Guide", code: "SETUP" },
    { name: "Phone vs DSLR", code: "PDSLR" },
    { name: "Mic/Tripod Basics", code: "TOOLS" },
    { name: "Budget Gear Picks", code: "BUDG" },
    { name: "Feature Explainers", code: "FEAT" },
    { name: "Pros/Cons Rapid", code: "PROCON" },
    { name: "Tips & Shortcuts", code: "TIPS" },
    { name: "Creator Workflow", code: "FLOW" },
    { name: "App Tutorial 30s", code: "TUT30" },
    { name: "Upgrade Worth It?", code: "UPWORTH" },
    { name: "Comparisons A vs B", code: "COMP" },
    { name: "Accessory Roundup", code: "ACC" },
    { name: "Buyer’s Guide VO", code: "BUY" },
  ],
  UGC: [
    { name: "30s Product Demo", code: "DEMO30" },
    { name: "Unboxing VO", code: "UNBOX" },
    { name: "Testimonial Script", code: "TESTI" },
    { name: "PAS (Problem-Agitate-Solve)", code: "PAS" },
    { name: "Before/After Story", code: "BEFAF" },
    { name: "A vs B Comparison", code: "AVSB" },
    { name: "Objection Handling", code: "OBJ" },
    { name: "Benefit-First Hook", code: "BENEFIT" },
    { name: "Pain-Point Hook", code: "PAIN" },
    { name: "Feature→Outcome", code: "FTO" },
    { name: "UGC Script Brief", code: "BRIEF" },
    { name: "CTA Vault", code: "CTA" },
    { name: "Compliance/Claims", code: "CLAIM" },
    { name: "Voice of Customer", code: "VOC" },
    { name: "Retention Beats", code: "BEAT" },
  ],
  BIZ: [
    { name: "Lead Gen Hooks", code: "LEADS" },
    { name: "Offer Breakdown", code: "OFFER" },
    { name: "Funnel Explain", code: "FUNNEL" },
    { name: "Case Study VO", code: "CASE" },
    { name: "Niche Positioning", code: "POSITION" },
    { name: "ICP Pain Points", code: "ICP" },
    { name: "SMB CTA Variants", code: "SMBCTA" },
    { name: "Pricing/Packaging", code: "PACK" },
    { name: "Cold Openers", code: "COLD" },
    { name: "Feature→Benefit", code: "FB" },
    { name: "Objection Map", code: "OBJMAP" },
    { name: "Testimonial VO", code: "TESTI" },
    { name: "Roadmap Update", code: "ROAD" },
    { name: "Hiring/Growth VO", code: "HIRE" },
    { name: "FAQ Explainers", code: "FAQ" },
  ],
  FIN: [
    { name: "Budget Systems", code: "BUDG" },
    { name: "Credit Score Tips", code: "CREDIT" },
    { name: "Investing Basics", code: "INVEST" },
    { name: "Index Funds 101", code: "INDEX" },
    { name: "Risk/Scam Warnings", code: "RISK" },
    { name: "Retirement VO", code: "RETIRE" },
    { name: "Tax Deductions", code: "TAX" },
    { name: "Side Income Ideas", code: "SIDE" },
    { name: "Stoicism & Money", code: "STOIC" },
    { name: "Emergency Fund", code: "EFUND" },
    { name: "Sinking Funds", code: "SINK" },
    { name: "Market Terms VO", code: "TERMS" },
    { name: "Money Psychology", code: "PSY" },
    { name: "Inflation Explainer", code: "INFL" },
    { name: "DCA vs Lump Sum", code: "DCA" },
  ],
  RE: [
    { name: "Listing Tour VO", code: "TOUR" },
    { name: "Neighborhood Guide", code: "HOOD" },
    { name: "Buy vs Rent", code: "BUYRENT" },
    { name: "Mortgage Basics", code: "MORT" },
    { name: "First-Time Mistakes", code: "FTB" },
    { name: "Market Update VO", code: "MARKET" },
    { name: "Home Staging Tips", code: "STAGE" },
    { name: "Offer Strategy", code: "OFFER" },
    { name: "Investment Props", code: "INVPROP" },
    { name: "Tax/Closing Costs", code: "CLOSE" },
    { name: "House Hacking", code: "HACK" },
    { name: "Rental Screening", code: "SCREEN" },
    { name: "Renovation ROI", code: "RENOROI" },
    { name: "Neighborhood Red Flags", code: "RF" },
    { name: "Open House Scripts", code: "OPEN" },
  ],
  HEALTH: [
    { name: "Nutrition Myths", code: "NMYTH" },
    { name: "Macro Basics", code: "MACRO" },
    { name: "Meal Planning", code: "MEAL" },
    { name: "Sleep Hygiene", code: "SLEEP" },
    { name: "Stress Reduction", code: "STRESS" },
    { name: "Hydration VO", code: "HYDRO" },
    { name: "Gut Health 101", code: "GUT" },
    { name: "Supplements Basics", code: "SUPP" },
    { name: "Mobility Routine", code: "MOB" },
    { name: "Habit Formation", code: "HABIT" },
    { name: "Sugar & Cravings", code: "SUGAR" },
    { name: "Label Reading", code: "LABEL" },
    { name: "Healthy Office Hacks", code: "OFFICE" },
    { name: "Mindful Eating", code: "MINDEAT" },
    { name: "Check-up Reminders", code: "CHECK" },
  ],
  STUDY: [
    { name: "Study Hacks", code: "HACK" },
    { name: "Pomodoro Scripts", code: "POMO" },
    { name: "Active Recall VO", code: "RECALL" },
    { name: "Cornell Notes 101", code: "CORNELL" },
    { name: "Exam Strategy", code: "EXAM" },
    { name: "Memory Techniques", code: "MEM" },
    { name: "Focus/Deep Work", code: "FOCUS" },
    { name: "Language Learning", code: "LANG" },
    { name: "Math Tricks", code: "MATH" },
    { name: "Science Explain", code: "SCI" },
    { name: "History in 60s", code: "HIST" },
    { name: "Essay Outline VO", code: "ESSAY" },
    { name: "App/Tool Picks", code: "APP" },
    { name: "Study Routine VO", code: "ROUT" },
    { name: "Procrastination Fix", code: "PROCR" },
  ],
  CAREER: [
    { name: "Resume Hooks", code: "RESUME" },
    { name: "Portfolio Teardown", code: "PORT" },
    { name: "Interview Q&A", code: "INT" },
    { name: "LinkedIn Hooks", code: "LINK" },
    { name: "Salary Negotiation", code: "SAL" },
    { name: "Career Switch VO", code: "SWITCH" },
    { name: "Workplace Comms", code: "COMMS" },
    { name: "Remote Work Tips", code: "REMOTE" },
    { name: "Manager 1:1 Scripts", code: "ONEONE" },
    { name: "Promotion Case", code: "PROMO" },
    { name: "Networking VO", code: "NET" },
    { name: "Cold DM Templates", code: "COLD" },
    { name: "Contract Basics", code: "CONTR" },
    { name: "Freelance to Full-time", code: "F2F" },
    { name: "Layoff Playbook", code: "LAYOFF" },
  ],
  CODE: [
    { name: "Dev Tips 30s", code: "TIPS" },
    { name: "Bug-Fix Walkthrough", code: "BUG" },
    { name: "System Design Nibbles", code: "SYS" },
    { name: "Code Review Mistakes", code: "REVIEW" },
    { name: "Tooling Shortcuts", code: "TOOL" },
    { name: "Framework A vs B", code: "FWK" },
    { name: "Security Basics", code: "SEC" },
    { name: "API Design VO", code: "API" },
    { name: "Prompting for Devs", code: "PROMPT" },
    { name: "Performance Tips", code: "PERF" },
    { name: "Git Hygiene", code: "GIT" },
    { name: "Testing Snippets", code: "TEST" },
    { name: "Clean Code VO", code: "CLEAN" },
    { name: "Career Advice", code: "CAREER" },
    { name: "Interview Prep", code: "INT" },
  ],
  SAAS: [
    { name: "Feature How-To", code: "FEAT" },
    { name: "Onboarding Flow", code: "ONB" },
    { name: "Use-Case Stories", code: "USE" },
    { name: "Integrations Demo", code: "INT" },
    { name: "Changelog VO", code: "CHANGE" },
    { name: "Compare vs Competitor", code: "COMP" },
    { name: "Pricing Explainer", code: "PRICE" },
    { name: "Security/Privacy", code: "SEC" },
    { name: "Case Study VO", code: "CASE" },
    { name: "FAQ/Support VO", code: "SUP" },
    { name: "Template Gallery", code: "TPL" },
    { name: "Admin Tips", code: "ADMIN" },
    { name: "Roadmap Update", code: "ROAD" },
    { name: "Enterprise Pitch", code: "ENT" },
    { name: "Partner Program", code: "PARTNER" },
  ],
  PARENT: [
    { name: "Toddler Routines VO", code: "TOD" },
    { name: "Gentle Discipline", code: "GENTLE" },
    { name: "Learning Activities", code: "LEARN" },
    { name: "Time-Saving Hacks", code: "TIME" },
    { name: "New Parent Mistakes", code: "NPM" },
    { name: "Safety Tips", code: "SAFE" },
    { name: "Family Budgeting", code: "FBUD" },
    { name: "Meal Prep for Kids", code: "KMEAL" },
    { name: "Screen Time Rules", code: "SCREEN" },
    { name: "Sibling Harmony", code: "SIB" },
    { name: "School Readiness", code: "SCHOOL" },
    { name: "Chore Charts", code: "CHORE" },
    { name: "Bedtime Scripts", code: "BED" },
    { name: "Travel with Kids", code: "KTRAVEL" },
    { name: "Parent Self-Care", code: "SELF" },
  ],
  MOTIV: [
    { name: "Morning Routine VO", code: "MORN" },
    { name: "Habit Stacking", code: "STACK" },
    { name: "Discipline > Motivation", code: "DISCIP" },
    { name: "Failure→Lesson", code: "FAIL" },
    { name: "Quote Breakdown", code: "QUOTE" },
    { name: "30-Day Challenge", code: "CHALL" },
    { name: "Visualization/Affirm", code: "VIS" },
    { name: "Mini-Wins Scripts", code: "WIN" },
    { name: "Reset After Lapse", code: "RESET" },
    { name: "Toxic Positivity Check", code: "TOX" },
    { name: "Focus Routines", code: "FOCUS" },
    { name: "Mindset Reframes", code: "REF" },
    { name: "Grind vs Rest", code: "BAL" },
    { name: "Self-Talk Swaps", code: "TALK" },
    { name: "End-of-Day Review", code: "EOD" },
  ],
  TRAVEL: [
    { name: "24h Itinerary VO", code: "ITIN24" },
    { name: "Budget Travel Tips", code: "BUDG" },
    { name: "Hidden Spots Narrative", code: "HIDDEN" },
    { name: "Local Food Guide", code: "FOOD" },
    { name: "Do/Don’t Lists", code: "DODONT" },
    { name: "Packing Checklist", code: "PACK" },
    { name: "Airport/Transit Hacks", code: "AIR" },
    { name: "Safety & Scams", code: "SAFE" },
    { name: "Solo Travel Scripts", code: "SOLO" },
    { name: "Couples’ Trip VO", code: "COUP" },
    { name: "Best Season VO", code: "SEASON" },
    { name: "Visa/Docs Basics", code: "VISA" },
    { name: "Photo Spots VO", code: "PHOTO" },
    { name: "Budget Breakdown", code: "BUDG2" },
    { name: "Itinerary Mistakes", code: "MIST" },
  ],
};

// (Optional – keep your existing followerCounts and scriptTones)
const followerCounts = [
  { name: "Less than 1,000", code: "0-1k" },
  { name: "1,000 - 10,000", code: "1k-10k" },
  { name: "10,000 - 50,000", code: "10k-50k" },
  { name: "50,000 - 100,000", code: "50k-100k" },
  { name: "100,000+", code: "100k+" },
];

const scriptTones = [
  { name: "Storytelling", code: "STORY" },
  { name: "Calm & Trust-Based", code: "CALM" },
  { name: "Bold / Dramatic", code: "BOLD" },
  { name: "Emotional / Vulnerable", code: "EMO" },
  { name: "Fast-Paced Value Drop", code: "FAST" },
  { name: "Educational / Step-by-step", code: "EDU" },
  { name: "Silent Vibe (B-roll style)", code: "SILENT" },
];
