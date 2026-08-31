"use client";
import React, { useState, useEffect } from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import TestimonialMarquee from "@/components/ui/marquee-01";
import {
  Newspaper,
  HeartPulse,
  Gem,
  Zap,
  GraduationCap,
  Radio,
} from "lucide-react";

const HERO_PLATES = [
  {
    title: "Longevity Protein & Satay Bowl",
    desc: "Grilled lean skewers, fresh cucumber, peanut dip & anti-inflammatory herbs",
    image: "/images/plate1.jpg"
  },
  {
    title: "Mediterranean Longevity Bowl",
    desc: "Wild salmon, avocado, pomegranate, quinoa & organic greens",
    image: "/images/plate2.jpg"
  },
  {
    title: "Antioxidant Rainbow Plate",
    desc: "Roasted sweet potatoes, kale, chickpeas, seeds & turmeric tahini",
    image: "/images/plate3.jpg"
  }
];

const CARD_IMAGES = {
  plan: "/images/healthy_meal_plan_1788153236006.png",
  science: "/images/science_food_1788153256636.png",
  platform: "/images/mediterranean_spread_1788153271636.png",
  book: "/images/healthy_food_book_1788153287226.png",
};

const TRUSTED_BY = [
  { name: "Forbes", icon: Newspaper },
  { name: "Men's Health", icon: HeartPulse },
  { name: "GQ", icon: Gem },
  { name: "Wired", icon: Zap },
  { name: "Harvard Medical", icon: GraduationCap },
  { name: "BBC", icon: Radio },
];

const PLATFORM_FEATURES = [
  { icon: "ðŸ“Š", title: "Longevity Score", desc: "Your personal food health score based on your diet, goals, and age. Know exactly where you stand." },
  { icon: "ðŸ“‹", title: "7-Day Eat-Right Plan", desc: "A done-for-you daily meal plan built around your goals. No research, no guesswork." },
  { icon: "ðŸ“°", title: "Daily Longevity Feed", desc: "New science-backed articles every day across 30+ categories from nutrition to sleep to gut health." },
  { icon: "💪", title: "Life Gain Tracker", desc: "Track the exact minutes of healthy life you are gaining from every food swap you make." },
];

export default function LandingScreen({ onNext }: { onNext: () => void }) {
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % HERO_PLATES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="lc-root">

      {/* SECTION 1: HERO — GENERATED CLONE IMAGE BACKGROUND */}
      <section className="lc-hero-clone" style={{ backgroundImage: `url('/images/hero_bg.png')` }}>
        
        {/* LEFT COLUMN: Clean white background with branding and typography overlay */}
        <div className="lc-clone-left-content">
          {/* Logo & Header */}
          <div className="lc-bio-header">
            <span className="lc-bio-logo-icon">⚡</span>
            <div className="lc-bio-logo-text">
              <span className="lc-bio-logo-title">LONGR</span>
            <span className="lc-bio-logo-subtitle">EAT SMARTER. LIVE LONGER.</span>
          </div>
        </div>

          {/* Big Typography styled like "BIO food" */}
          <div className="lc-bio-title-wrap">
            <h1 className="lc-bio-main-title">Choose to Live Longer.</h1>
          </div>

          {/* Subtext and Badge */}
          <p className="lc-bio-subtitle-text">
            How to Eat Right, Turn Back Your Biological Clock, and Add Decades of Healthy Years to Your Life. Take our 90-second science-backed quiz to get your personalized Longevity Score and custom 7-Day Plan.
          </p>

          <div className="lc-bio-badge-row">
            <span className="lc-bio-check-pill">✓ 90 Seconds</span>
            <span className="lc-bio-check-pill">✓ 100% Free</span>
            <span className="lc-bio-check-pill">✓ Science-Backed</span>
          </div>

          <button className="lc-cta-primary lc-bio-cta" onClick={onNext}>
            Start Free Quiz &rarr;
          </button>

          {/* Footer details */}
          <div className="lc-bio-footer-links">
            <span className="lc-bio-footer-social">📞 📧 📍 💬</span>
            <span className="lc-bio-footer-web">longr.io</span>
            <span className="lc-bio-footer-phone">+34 786 5214 32</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: "AS SEEN IN" TRUST STRIP */}
      <section className="lc-trust-strip">
        <p className="lc-trust-label">AS FEATURED IN &amp; TRUSTED BY READERS FROM</p>
        <InfiniteSlider gap={72} duration={28} className="lc-trust-marquee">
          {TRUSTED_BY.map((brand) => (
            <div
              key={brand.name}
              className="flex select-none items-center gap-3 whitespace-nowrap text-white opacity-80 transition-opacity hover:opacity-100"
            >
              <brand.icon className="h-6 w-6 text-white/70" strokeWidth={2.2} />
              <span className="font-serif text-2xl font-black tracking-tight">
                {brand.name}
              </span>
            </div>
          ))}
        </InfiniteSlider>
      </section>

      {/* SECTION 2.5: SALES LETTER NARRATIVE */}
      <section className="lc-sales-letter">
        <div className="lc-sl-container">
          <h2 className="lc-sl-headline">
            If you want to effortlessly add healthy years to your life and feel a surge of daily energy... <span className="lc-sl-highlight">then this will be the most important page you'll ever read.</span>
          </h2>
          
          <img 
            src="/images/hero_food_bowl_1788153300357.png" 
            alt="Healthy Longevity Food and Recipes" 
            className="lc-sl-hero-img" 
          />
          
          <div className="lc-sl-body">
            <p>Dear Friend,</p>
            <p>If you want to create a torrential downpour of energy that floods your body...</p>
            <p>And literally <strong>DEMAND that your biological age goes in reverse...</strong></p>
            <p>Then this will be the most important message you'll ever read.</p>
            
            <p className="lc-sl-spacer">Here's why:</p>
            
            <p>Not too long ago, I was completely overwhelmed by conflicting health advice.</p>
            <p>I was desperately searching for the right foods to eat, practically "begging" for a clear answer on how to improve my health.</p>
            <p>I would wake up feeling sluggish every morning, despite trying every new diet trend.</p>
            <p>Mostly, I found myself frustrated, eating foods that simply made me feel worse.</p>
            <p>I did this day in, day out, for months on end.</p>
            <p>Grinding it out and hoping for a change.</p>
            
            <p className="lc-sl-spacer">Then, one day, I came across a <em>"crazy idea"</em>.</p>
            
            <p>That allowed me to take all the complex nutritional science and <strong>'automate'</strong> it.</p>
            <p>So instead of spending hours researching what to eat every day...</p>
            <p>I could follow a simple, proven system...</p>
            <p className="lc-sl-highlight-text">That adds minutes of life to every meal!</p>
            
            <p>Everyone thought it was too simple, and that there was no way this could possibly work...</p>
            <p>An old friend even called it a "fad".</p>
            <p>But I couldn't give two shits...</p>
            <p>Because I had nothing to lose and everything to gain.</p>
            
            <p className="lc-sl-spacer">So, after a lot of late nights, early mornings and a tonne of trial and error...</p>
            
            <p>I finally discovered a <strong>'secret eating system'</strong> focused purely on longevity.</p>
            <p>And everything changed for me.</p>
            <p>Instead of stressing over every calorie...</p>
            <p>I had more energy and vitality than I could possibly handle!</p>
            
            <p>And I used this "eating system" to quickly catapult my health, and subsequently built <strong>LONGR</strong> to share it with the world.</p>
            <p>Helping thousands of people add verifiable years to their lives in just 90 seconds a day!...<br/>But it's not just me!</p>
            <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '20px' }}>
              <button className="lc-guarantee-btn" onClick={onNext}>
                Live Longer &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TWO-PATH OFFER CARDS */}
      <section className="lc-paths-section">
        <p className="lc-eyebrow">CHOOSE YOUR PATH TO A LONGER LIFE</p>
        <h2 className="lc-section-title">Two Ways to Eat Smarter.<br /><span className="lc-green">One Goal: Add Years to Your Life.</span></h2>
        <div className="lc-paths-grid">
          <div className="lc-path-card-stack">
            <div className="lc-path-card">
              <div className="lc-path-img" style={{ backgroundImage: `url(${CARD_IMAGES.plan})` }}>
                <div className="lc-path-img-overlay" />
                <span className="lc-path-tag">DONE FOR YOU</span>
              </div>
              <div className="lc-path-body">
                <h3>🍽️ THE PLAN</h3>
                <p>Get a personalized daily eating plan built around your goal. No research, no guesswork. Just follow the swaps.</p>
                <button className="lc-cta-secondary" onClick={onNext}>Get My Free Plan &rarr;</button>
              </div>
            </div>
          </div>
          <div className="lc-path-card-stack">
            <div className="lc-path-card">
              <div className="lc-path-img" style={{ backgroundImage: `url(${CARD_IMAGES.science})` }}>
                <div className="lc-path-img-overlay" />
                <span className="lc-path-tag lc-path-tag-alt">LEARN THE SCIENCE</span>
              </div>
              <div className="lc-path-body">
                <h3>🔬 THE SCIENCE</h3>
                <p>Understand the "why" behind every food swap. Science-backed breakdowns so you can make the right calls for life.</p>
                <button className="lc-cta-secondary" onClick={onNext}>Explore the Feed &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <img src="/images/food.png" alt="Longevity food" className="lc-paths-photo" />

      {/* SECTION 4: GROW FASTER BOLD STATEMENT */}
      <section className="lc-bold-statement">
        <div className="lc-bold-statement-inner">
          <p className="lc-eyebrow lc-eyebrow-green">THE LONGR DIFFERENCE</p>
          <h2 className="lc-bold-title">
            Grow <span className="lc-green">10x Healthier.</span><br />
            Faster. Smarter.
          </h2>
          <p className="lc-bold-sub">
            Most nutrition advice is vague, contradictory, and built to sell you something. LONGR is different. We translate the real science into daily 2-minute reads that compound into real, measurable years added to your life.
          </p>
          <div className="lc-bold-stats">
            {[
              { num: "184K", label: "Minutes of Life Gained" },
              { num: "12K+", label: "Daily Active Readers" },
              { num: "30+", label: "Longevity Categories" },
              { num: "4.8", label: "Average Reader Rating" },
            ].map(s => (
              <div key={s.label} className="lc-bold-stat-stack">
                <div className="lc-bold-stat-card">
                  <span className="lc-big-num">{s.num}</span>
                  <span className="lc-num-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="lc-cta-primary" style={{ backgroundColor: '#ffffff', color: '#000000', borderRadius: '50px', border: 'none', padding: '15px 30px', fontWeight: 800, fontSize: '1em', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }} onClick={onNext}>Add Me Some Years &rarr;</button>
        </div>
      </section>

      <img src="/images/foodie.png" alt="Longevity food" className="lc-paths-photo" />

      {/* SECTION 5: SUCCESS STORIES */}
      <section className="lc-success-section">
        <p className="lc-eyebrow lc-eyebrow-green">READER RESULTS</p>
        <h2 className="lc-section-title">Become Our Next <span className="lc-green">Success Story</span></h2>
        <p className="lc-section-sub">Real readers. Real food swaps. Real minutes added to their lives.</p>
        <TestimonialMarquee />
        <button className="lc-cta-outline" style={{ marginTop: '64px' }} onClick={onNext}>See If LONGR Is Right for You &rarr;</button>
      </section>

      {/* SECTION 6: THE PLATFORM */}
      <section className="lc-platform-section" style={{ backgroundImage: `url(${CARD_IMAGES.platform})` }}>
        <div className="lc-platform-overlay" />
        <div className="lc-platform-content">
          <p className="lc-eyebrow lc-eyebrow-green">EVERYTHING YOU NEED</p>
          <h2 className="lc-platform-title">The Power Is<br />In the Platform</h2>
          <p className="lc-platform-sub">One free account. Everything you need to build a longer, healthier life — starting today.</p>
          <div className="lc-features-grid">
            {PLATFORM_FEATURES.map((f) => (
              <div key={f.title} className="lc-feature-item">
                <div className="lc-feature-icon">{f.icon}</div>
                <div>
                  <div className="lc-feature-title">{f.title}</div>
                  <div className="lc-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="lc-cta-primary" style={{ backgroundColor: '#ffffff', color: '#000000', borderRadius: '50px', border: 'none', padding: '15px 30px', fontWeight: 800, fontSize: '1em', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }} onClick={onNext}>Get Instant Free Access &rarr;</button>
        </div>
      </section>

      {/* SECTION 7: OFFER SECTION */}
      <section className="lc-offer-section">
        <div className="lc-offer-inner">
          <div className="lc-offer-text">
            <p className="lc-eyebrow lc-eyebrow-green">FREE FOR A LIMITED TIME</p>
            <h2 className="lc-offer-title">Get Your Free<br /><span className="lc-green">Longevity Score</span><br />+ 7-Day Plan</h2>
            <p className="lc-offer-sub">
              This is the same personalized framework used by thousands of readers who have already added minutes — and years — to their lives. And right now, it's completely free.
            </p>
            <ul className="lc-offer-checklist">
              {[
                "Your personalized Longevity Score (based on your goals & diet)",
                "A free 7-Day Eat-Right Plan — built for you, not a generic template",
                "4 science-backed articles unlocked instantly",
                "Access to the full LONGR daily feed (30+ longevity categories)",
                "Life Gain tracker to watch your minutes compound daily"
              ].map(item => (
                <li key={item} className="lc-offer-check-item">
                  <span className="lc-check-icon">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button className="lc-cta-primary" style={{ backgroundColor: '#ffffff', color: '#000000', borderRadius: '50px', border: 'none', padding: '15px 30px', fontWeight: 800, fontSize: '1em', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }} onClick={onNext}>Claim My Free Score Now &rarr;</button>
            <p className="lc-offer-disclaimer">100% Free. No credit card. No spam. Cancel anytime.</p>
          </div>
          <div className="lc-offer-visual">
            <div className="lc-score-mockup">
              <div className="lc-mockup-ring">
                <div className="lc-mockup-score">78</div>
                <div className="lc-mockup-label">Your Score</div>
              </div>
              <div className="lc-mockup-unlocks">
                {[
                  { icon: "ðŸ“Š", label: "Longevity Score" },
                  { icon: "ðŸ“‹", label: "7-Day Plan" },
                  { icon: "ðŸ“°", label: "4 Articles" },
                  { icon: "💪", label: "Life Tracker" },
                ].map(u => (
                  <div key={u.label} className="lc-mockup-unlock">
                    <div className="lc-mockup-unlock-icon">{u.icon}</div>
                    <div className="lc-mockup-unlock-label">{u.label}</div>
                    <div className="lc-mockup-unlock-badge">✓ Unlocked</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: GUARANTEE */}
      <section className="lc-guarantee-section">
        <div className="lc-rotating-plates">
          <img src="/images/plate_salad_1786262386344.png" className="lc-plate lc-plate-1" alt="Healthy Salad Plate" />
          <img src="/images/plate_salmon_1786262434710.png" className="lc-plate lc-plate-2" alt="Salmon Plate" />
          <img src="/images/plate_mediterranean_1786262400354.png" className="lc-plate lc-plate-3" alt="Mediterranean Plate" />
          <img src="/images/plate_acai_1786262412142.png" className="lc-plate lc-plate-4" alt="Acai Bowl Plate" />
        </div>
        <div className="lc-guarantee-badge-icon">💪</div>
        <h2 className="lc-guarantee-title">WE GUARANTEE YOU'LL LEARN ONE THING THAT CHANGES WHAT'S ON YOUR PLATE<br />— OR YOUR NEXT PLAN IS ON US.</h2>
        <p className="lc-guarantee-body">
          Follow your 7-Day Eat-Right Plan for one week. If you don't walk away with at least one swap you'll actually keep — tell us. We'll build you a second plan at zero cost. No fine print. No gotchas. No questions asked.
        </p>
        <div className="lc-guarantee-points">
          <div className="lc-gp"><span>✓</span><span>100% Free to Start</span></div>
          <div className="lc-gp"><span>✓</span><span>No Card Required</span></div>
          <div className="lc-gp"><span>✓</span><span>Science-Backed Results</span></div>
        </div>
        <button className="lc-guarantee-btn" onClick={onNext}>
          Live Longer &rarr;
        </button>
      </section>

      {/* SECTION 9: FINAL CTA */}
      <section className="lc-final-cta">
        <div className="lc-final-cta-inner">
          <p className="lc-eyebrow lc-eyebrow-green">STOP WAITING. START LIVING LONGER.</p>
          <h2 className="lc-final-title">
            What's One Year of Your Life<br />Worth to You?
          </h2>
          <p className="lc-final-sub">
            Every day you delay is a day your plate is working against you. It takes 90 seconds. It's completely free. And it might be the most important quiz you take all year.
          </p>
          <button className="lc-cta-primary lc-cta-xl" style={{ backgroundColor: '#ffffff', color: '#000000', borderRadius: '50px', border: 'none', padding: '15px 30px', fontWeight: 800, fontSize: '1em', cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }} onClick={onNext}>
            Add Me Some Years Now &rarr;
          </button>
          <div className="lc-final-trust">
            <span>⭐⭐⭐⭐⭐ 4.8</span>
            <span>·</span>
            <span>12,000+ Readers</span>
            <span>·</span>
            <span>✅ 100% Free</span>
            <span>·</span>
            <span>⏱️ 90 Seconds</span>
          </div>
        </div>
      </section>

    </div>
  );
}
