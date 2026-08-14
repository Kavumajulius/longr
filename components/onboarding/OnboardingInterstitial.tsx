"use client";

/* eslint-disable @next/next/no-img-element */

import { CheckCircle2, LoaderCircle, Quote, ShieldCheck, Star } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";

type InterstitialKind = "prep_intro" | "prep_trust" | "reassure_one" | "reassure_two" | "progress" | "loading";

const CONTENT: Record<Exclude<InterstitialKind, "loading">, { eyebrow: string; title: string; body: string; image: string; button: string }> = {
  prep_intro: { eyebrow: "Your Healthy Years path", title: "Food guidance built around the years ahead", body: "Longr turns your priorities into a practical reading path—starting with the everyday food decision you want to make easier first.", image: "/images/onboarding/welcome-meal.png", button: "Continue" },
  prep_trust: { eyebrow: "A few thoughtful questions", title: "A clearer plan starts with what matters to you", body: "Tell us about your goals, current concerns, and real-life barriers. Your answers will shape your profile, first-week path, and recommended reads.", image: "/images/onboarding/grocery-confidence.png", button: "Start My 16 Questions" },
  reassure_one: { eyebrow: "You’re making progress", title: "Great—let’s turn the nutrition noise into a clearer next step", body: "Longr is designed for adults 40+ who want understandable, age-relevant food guidance without another restrictive diet. We’ll use your answers to reduce the noise and make your first choices practical.", image: "/images/onboarding/morning-reassurance.png", button: "Continue My Profile" },
  reassure_two: { eyebrow: "Your path is taking shape", title: "There’s no need to overhaul everything at once", body: "Healthy aging is supported by patterns built over time—not one perfect food or one perfect week. Longr will help you focus on one useful decision, then build from there at a pace that fits your life.", image: "/images/onboarding/cooking-confidence.png", button: "Keep Going" },
  progress: { eyebrow: "Your answers are complete", title: "You’re already building a clearer food path", body: "You identified what matters, what gets in the way, and the first result you want. Next, Longr will connect those answers into your Healthy Years Profile.", image: "/images/onboarding/welcome-meal.png", button: "Build My Profile" },
};

const CAROUSEL_IMAGES: Record<Exclude<InterstitialKind, "loading">, string[]> = {
  prep_intro: ["/images/onboarding/welcome-meal.png", "/images/onboarding/asian-couple-cooking.png", "/images/onboarding/mixed-friends-dinner.png", "/images/onboarding/white-couple-market.png"],
  prep_trust: ["/images/onboarding/grocery-confidence.png", "/images/onboarding/white-couple-market.png", "/images/onboarding/asian-couple-cooking.png", "/images/onboarding/mixed-friends-dinner.png"],
  reassure_one: ["/images/onboarding/morning-reassurance.png", "/images/onboarding/latino-garden.png", "/images/onboarding/middle-eastern-family.png"],
  reassure_two: ["/images/onboarding/cooking-confidence.png", "/images/onboarding/diverse-park-picnic.png", "/images/onboarding/latino-garden.png"],
  progress: ["/images/onboarding/diverse-park-picnic.png", "/images/onboarding/middle-eastern-family.png", "/images/onboarding/latino-garden.png"],
};

export function OnboardingInterstitial({ kind, onContinue }: { kind: Exclude<InterstitialKind, "loading">; onContinue: () => void }) {
  const item = CONTENT[kind];
  const images = CAROUSEL_IMAGES[kind];
  const [imageIndex, setImageIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setImageIndex(current => (current + 1) % images.length), 3000);
    return () => window.clearInterval(timer);
  }, [images.length]);
  const activeImage = images[imageIndex] ?? item.image;
  return <section className="screen active onb-interstitial"><div className="interstitial-copy"><p className="quiz-kicker">{item.eyebrow}</p><h1 className="step-title">{item.title}</h1><p className="step-sub">{item.body}</p><div className="interstitial-proof"><span><CheckCircle2 size={17} /> Personalized from your answers</span><span><ShieldCheck size={17} /> Educational—not diagnostic</span></div><button className="cta-btn" type="button" onClick={onContinue}>{item.button}</button></div><div className="interstitial-image carousel-image-frame"><img className="carousel-image-backdrop" src={activeImage} alt="" aria-hidden="true" /><img key={activeImage} className="carousel-image-main" src={activeImage} alt="Adults from diverse backgrounds making confident, healthy everyday food choices" /><div className="carousel-dots" aria-label={`Image ${imageIndex + 1} of ${images.length}`}>{images.map((image, index) => <span className={index === imageIndex ? "active" : ""} key={image} />)}</div></div></section>;
}

export function OnboardingLoading({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(8);
  const [reviewIndex, setReviewIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setProgress(value => Math.min(100, value + 1)), 150);
    const done = window.setTimeout(onComplete, 14300);
    return () => { window.clearInterval(timer); window.clearTimeout(done); };
  }, [onComplete]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setReviewIndex(index => (index + 1) % LOADING_REVIEWS.length), 2700);
    return () => window.clearInterval(timer);
  }, []);

  const review = LOADING_REVIEWS[reviewIndex];

  return (
    <section className="screen active onb-loading-screen">
      <div className="loading-summary">
        <div
          className="loading-ring"
          role="progressbar"
          aria-label="Building your Healthy Years Profile"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          style={{
            "--loading-progress": `${progress * 3.6}deg`,
            "--loading-image": "url('/images/onboarding/reviews/plant-forward-plate.webp')",
          } as CSSProperties}
        >
          <span className="loading-ring-photo" aria-hidden="true" />
          <div><LoaderCircle size={24} /><strong>{progress}%</strong></div>
        </div>
        <div className="loading-summary-copy">
          <p className="quiz-kicker">Personalizing your Longr path</p>
          <h1 className="step-title">Building your Healthy Years Profile…</h1>
          <p className="step-sub">Connecting your goals, food focus, practical first win, and preferred pace.</p>
          <div className="loading-value-cards">
            <article><img className="loading-value-icon" src="/images/onboarding/loading-clarity-3d.png" alt="" aria-hidden="true" /><strong>Clearer starting point</strong><span>Selected around your answers</span></article>
            <article><img className="loading-value-icon" src="/images/onboarding/loading-guidance-3d.png" alt="" aria-hidden="true" /><strong>Responsible guidance</strong><span>No diagnosis or health-risk score</span></article>
          </div>
        </div>
      </div>

      <div className="loading-stories" aria-label="Illustrative member review carousel">
        <div className="loading-stories-heading">
          <div><span>Food-first progress</span><strong>Small choices members can use right away</strong></div>
          <span className="loading-stories-count">{reviewIndex + 1} / {LOADING_REVIEWS.length}</span>
        </div>
        <article className="loading-story" key={review.name} style={{ "--story-accent": review.accent } as CSSProperties}>
          <img className="loading-story-backdrop" src={review.image} alt="" aria-hidden="true" />
          <div className="loading-story-photo-card">
            <div className="loading-story-brand"><span>LONGR</span><i /><i /><i /></div>
            <img className="loading-story-food" src={review.image} alt={review.foodAlt} />
            <div className="loading-story-footer">
              <span className="loading-story-avatar" aria-hidden="true">{review.initials}</span>
              <span><strong>{review.name}</strong><small>Sample member story</small></span>
              <span className="loading-story-stars" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} fill="currentColor" />)}
              </span>
            </div>
          </div>
          <blockquote className="loading-story-quote"><Quote size={19} aria-hidden="true" /><p>{review.quote}</p></blockquote>
        </article>
        <div className="loading-story-dots" aria-label="Choose a sample story">
          {LOADING_REVIEWS.map((item, index) => (
            <button className={index === reviewIndex ? "active" : ""} type="button" key={item.name} aria-label={`Show story ${index + 1}`} aria-current={index === reviewIndex ? "true" : undefined} onClick={() => setReviewIndex(index)} />
          ))}
        </div>
      </div>

      <p className="loading-review-note">Design preview: review copy is illustrative and should be replaced with verified member testimonials before publishing.</p>
    </section>
  );
}

const LOADING_REVIEWS = [
  {
    image: "/images/onboarding/reviews/grilled-herb-chicken.webp",
    foodAlt: "Grilled herb chicken with colorful vegetables on a ceramic plate",
    name: "Maya, 52",
    initials: "MJ",
    quote: "The daily prompts helped me choose a better lunch without turning food into another full-time project.",
    accent: "#efaa27",
  },
  {
    image: "/images/onboarding/reviews/turmeric-potatoes.webp",
    foodAlt: "Turmeric potatoes, roasted cauliflower, greens, and mint yogurt on a charcoal plate",
    name: "Daniel, 58",
    initials: "DK",
    quote: "I stopped saving articles I never read. One clear idea at a time was much easier to use.",
    accent: "#16a76a",
  },
  {
    image: "/images/onboarding/reviews/chickpea-curry.webp",
    foodAlt: "Tomato chickpea curry with brown rice and greens on a ceramic plate",
    name: "Priya, 49",
    initials: "PS",
    quote: "The swaps felt realistic enough for our normal grocery shop, which made consistency feel possible.",
    accent: "#f5c20b",
  },
  {
    image: "/images/onboarding/reviews/grilled-salmon.webp",
    foodAlt: "Grilled salmon with vegetables, quinoa, lime, and avocado sauce on a dark plate",
    name: "Marcus, 61",
    initials: "MB",
    quote: "I liked that the guidance focused on what to add to my plate, not a list of foods to fear.",
    accent: "#0c9b49",
  },
  {
    image: "/images/onboarding/reviews/plant-forward-plate.webp",
    foodAlt: "Roasted vegetables, chickpeas, avocado, beetroot, and quinoa on a ceramic plate",
    name: "Elaine, 56",
    initials: "EO",
    quote: "Three minutes was enough to learn one thing and make a smarter dinner choice that evening.",
    accent: "#dc6e38",
  },
] as const;
