"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { Activity, BookOpen, Brain, Check, ChefHat, Clock3, Dumbbell, Flame, Gift, HeartPulse, Leaf, LockKeyhole, Salad, ShieldCheck, ShoppingBasket, Soup, Sparkles, Target, Wheat, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { publicAppUrl } from "@/lib/app-url";
import { ageFocus, answerLabel, blockerPromise, type OnboardingAnswers } from "@/components/onboarding/onboarding-data";

export type PlanTier = "weekly" | "monthly" | "annual";
interface PlanDef { tier: PlanTier; name: string; amount: number; period: string; note: string; renewal: string; recommended?: boolean; }
const PLANS: PlanDef[] = [
  { tier: "weekly", name: "1 week", amount: 11.99, period: "/week", note: "A short start", renewal: "$11.99 weekly" },
  { tier: "monthly", name: "4 weeks", amount: 24.99, period: "/4 weeks", note: "Flexible access", renewal: "$24.99 every 4 weeks" },
  { tier: "annual", name: "Annual", amount: 79.99, period: "/year", note: "Equivalent to $6.67/month", renewal: "$79.99 annually", recommended: true },
];
const ACCESS_CATEGORIES = [
  { label: "Heart & Metabolic Health", image: "/images/categories/heart_metabolic.png" },
  { label: "Brain Health", image: "/images/categories/brain_health.png" },
  { label: "Strength & Mobility", image: "/images/categories/strength_mobility.png" },
  { label: "Healthy Aging", image: "/images/categories/healthy_aging.png" },
  { label: "Better Breakfasts", image: "/images/categories/better_breakfast.png" },
  { label: "Smart Grocery Shopping", image: "/images/categories/grocery_shopping.png" },
  { label: "Everyday Food Swaps", image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=300&q=80" },
  { label: "Labels & Preparation", image: "https://images.unsplash.com/photo-1556910103-1c02745a872f?auto=format&fit=crop&w=300&q=80" },
  { label: "Eat More Often", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80" },
];
interface CheckoutPricing {
  currency: "usd";
  regularAmount: number;
  discount: number;
  discountAmount: number;
  total: number;
  renewalAmount: number;
  billingPeriodDays: number;
}
interface CheckoutSession {
  sessionId: string;
  planId: string | null;
  purchaseUrl: string | null;
  promoCode: string | null;
  pricing: CheckoutPricing;
}
export interface PurchaseCompletion {
  receiptId: string;
  planId: string;
  sessionId: string;
  tier: PlanTier;
  discount: number;
}
interface PaywallProps {
  variant?: "step" | "modal"; userEmail?: string | null; userName?: string | null; answers?: OnboardingAnswers;
  recommendations?: string[]; discount?: number; discountToken?: string | null; onPaid?: (purchase: PurchaseCompletion) => void; onSkip?: () => void; onClose?: () => void;
  onEvent?: (name: string, details?: Record<string, unknown>) => void;
}

export default function Paywall({ variant = "step", userEmail, userName, answers, recommendations = [], discount = 0, discountToken = null, onPaid, onSkip, onClose, onEvent }: PaywallProps) {
  const [selected, setSelected] = useState<PlanTier>("annual");
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [abandonmentOpen, setAbandonmentOpen] = useState(false);
  const [preloadSession, setPreloadSession] = useState<CheckoutSession | null>(null);
  const [activeDiscount, setActiveDiscount] = useState(discount);
  const [activeDiscountToken, setActiveDiscountToken] = useState(discountToken);
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + 10 * 60 * 1000);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const checkoutCardRef = useRef<HTMLDivElement>(null);

  // ── Prefetch state: silently fetch the checkout session in the background ──
  const prefetchedSession = useRef<CheckoutSession | null>(null);
  const prefetchedAt = useRef<number>(0);
  const prefetchedTier = useRef<PlanTier | null>(null);
  const prefetchedDiscount = useRef<number>(-1);
  const cachedIdToken = useRef<{ token: string; expiresAt: number } | null>(null);
  const prefilledEmail = useRef(userEmail ?? "");

  useEffect(() => { onEvent?.("paywall_viewed", { discount }); }, [onEvent, discount]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setActiveDiscountToken(null);
        setActiveDiscount((current) => {
          if (current > 0) onEvent?.("discount_expired");
          return 0;
        });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, onEvent]);
  useEffect(() => {
    if (!checkoutOpen) return;
    const resetScroll = () => { if (checkoutCardRef.current) checkoutCardRef.current.scrollTop = 0; };
    resetScroll();
    const timer = window.setTimeout(resetScroll, 600);
    return () => window.clearTimeout(timer);
  }, [checkoutOpen, session]);

  // ── Pre-warm Firebase ID token so it is ready before the user clicks ──
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    let cancelled = false;
    currentUser.getIdToken(false).then((token) => {
      if (cancelled) return;
      // Cache for 50 minutes (Firebase tokens last 60 min)
      cachedIdToken.current = { token, expiresAt: Date.now() + 50 * 60 * 1000 };
    }).catch(() => { /* non-fatal — fall back to fresh token on click */ });
    return () => { cancelled = true; };
  }, []);

  // ── Silently prefetch the checkout session in the background ──
  const silentPrefetch = useCallback(async (tier: PlanTier, currentDiscount: number, currentDiscountToken: string | null) => {
    const currentUser = auth.currentUser;
    try {
      let idToken: string | undefined;
      if (currentUser) {
        // Use cached token if still valid, otherwise refresh
        if (cachedIdToken.current && cachedIdToken.current.expiresAt > Date.now()) {
          idToken = cachedIdToken.current.token;
        } else {
          idToken = await currentUser.getIdToken(false);
          cachedIdToken.current = { token: idToken, expiresAt: Date.now() + 50 * 60 * 1000 };
        }
      }
      const authenticated = currentUser && idToken
        ? { uid: currentUser.uid, idToken }
        : {};
      const response = await fetch("/api/whop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authenticated,
          email: userEmail,
          tier,
          discount: currentDiscount,
          discountToken: currentDiscountToken,
        }),
      });
      if (!response.ok) return; // silent failure — on-demand fetch will handle the error
      const data = await response.json() as CheckoutSession;
      prefetchedSession.current = data;
      prefetchedAt.current = Date.now();
      prefetchedTier.current = tier;
      prefetchedDiscount.current = currentDiscount;
      // Trigger hidden pre-render of the embed so the iframe loads before user clicks
      setPreloadSession(data);
      // Remember the email for prefill after session is created
      prefilledEmail.current = userEmail ?? "";
    } catch {
      // non-fatal: on-demand fetch in startCheckout is the fallback
    }
  }, [userEmail]);

  // Trigger prefetch on mount and whenever plan or discount changes
  useEffect(() => {
    // Short delay so prefetch doesn't compete with initial paint
    const timer = window.setTimeout(() => {
      void silentPrefetch(selected, activeDiscount, activeDiscountToken);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [selected, activeDiscount, activeDiscountToken, silentPrefetch]);

  async function startCheckout() {
    if (loading) return;
    setSession(null); setError(""); setPaid(false);
    setCheckoutOpen(true);
    onEvent?.("checkout_started", { tier: selected, discount: activeDiscount });

    // ── Use the prefetched session if it is fresh (<5 min) and matches current plan/discount ──
    const SESSION_MAX_AGE_MS = 5 * 60 * 1000;
    const isCached =
      prefetchedSession.current !== null &&
      prefetchedTier.current === selected &&
      prefetchedDiscount.current === activeDiscount &&
      Date.now() - prefetchedAt.current < SESSION_MAX_AGE_MS;

    if (isCached && prefetchedSession.current) {
      // Reuse the warm session whose iframe is already pre-rendered.
      // Do NOT refetch here: a new sessionId would remount WhopCheckoutEmbed
      // and force the card fields to reload from scratch while visible.
      setSession(prefetchedSession.current);
      setPreloadSession(null);
      prefetchedSession.current = null;
      prefetchedAt.current = 0;
      onEvent?.("checkout_session_cached", { tier: selected, discount: activeDiscount });
      return;
    }

    // ── Fallback: on-demand fetch (only when no warm session is available) ──
    const currentUser = auth.currentUser;
    setLoading(true);
    try {
      let idToken: string | undefined;
      if (currentUser) {
        if (cachedIdToken.current && cachedIdToken.current.expiresAt > Date.now()) {
          idToken = cachedIdToken.current.token;
        } else {
          idToken = await currentUser.getIdToken();
          cachedIdToken.current = { token: idToken, expiresAt: Date.now() + 50 * 60 * 1000 };
        }
      }
      const authenticated = currentUser && idToken
        ? { uid: currentUser.uid, idToken }
        : {};
      const response = await fetch("/api/whop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authenticated,
          email: userEmail,
          tier: selected,
          discount: activeDiscount,
          discountToken: activeDiscountToken,
        }),
      });
      const text = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server error: The checkout service is temporarily unavailable.");
      }
      if (!response.ok) throw new Error((data as { error?: string } | null)?.error || "Something went wrong starting checkout.");
      setSession(data as CheckoutSession);
    } catch (checkoutError) { setError(checkoutError instanceof Error ? checkoutError.message : "Something went wrong starting checkout."); }
    finally { setLoading(false); }
  }
  async function handleComplete(planId: string, receiptId?: string, result?: any) {
    const currentSession = session ?? preloadSession;
    const discount = currentSession?.pricing.discount ?? activeDiscount;
    const sessionId = currentSession?.sessionId ?? "";

    if (result?.type === "payment_failed") {
      setError(result.message || "Payment failed. Please try again.");
      setPaid(false);
      setCheckoutOpen(true);
      onEvent?.("payment_failed", { tier: selected, discount, receiptId: receiptId ?? "" });
      return;
    }

    if (result?.type === "requires_action") {
      onEvent?.("requires_action", { tier: selected, discount, receiptId: receiptId ?? "", result });
      setError(result.message || "Payment requires additional action (e.g., 3D Secure).");
      setPaid(false);
      setCheckoutOpen(true);
      return;
    }

    setPaid(true);
    setCheckoutOpen(false);
    onEvent?.("purchase_completed", { tier: selected, discount, receiptId: receiptId ?? "" });
    window.setTimeout(() => onPaid?.({
      receiptId: receiptId ?? "",
      planId,
      sessionId,
      tier: selected,
      discount,
    }), 700);
  }
  function closeCheckout() { setCheckoutOpen(false); setSession(null); setAbandonmentOpen(true); onEvent?.("checkout_closed", { tier: selected, discount: activeDiscount }); }
  async function acceptSaveOffer() {
    setError("");
    try {
      const response = await fetch("/api/whop/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "boost", token: activeDiscountToken }),
      });
      const text = await response.text();
      let result: unknown;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("Server error: The additional offer could not be applied.");
      }
      if (!response.ok) {
        throw new Error((result as { error?: string })?.error || "The additional offer could not be applied.");
      }
      const typedResult = result as { discount?: number; token?: string; error?: string };
      if (typeof typedResult.discount !== "number" || !typedResult.token) {
        throw new Error(typedResult.error || "The additional offer could not be applied.");
      }
      setActiveDiscount(typedResult.discount);
      setActiveDiscountToken(typedResult.token);
      setExpiresAt(Date.now() + 10 * 60 * 1000);
      setSecondsLeft(600);
      setAbandonmentOpen(false);
      onEvent?.("abandonment_offer_accepted", { discount: typedResult.discount });
    } catch (offerError) {
      setError(offerError instanceof Error ? offerError.message : "The additional offer could not be applied.");
    }
  }

  const goal = answers ? answerLabel("primary_future_goal", answers.primary_future_goal) : "healthier years ahead";
  const firstWin = answers ? answerLabel("first_week_win", answers.first_week_win) : "Build one better food habit";
  const time = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const selectedPlan = PLANS.find((plan) => plan.tier === selected) ?? PLANS[2];
  const selectedIntro = selectedPlan.amount * (1 - activeDiscount / 100);
  const dailyEquivalent = (plan: PlanDef) => {
    const days = plan.tier === "weekly" ? 7 : plan.tier === "monthly" ? 28 : 365;
    return (plan.amount * (1 - activeDiscount / 100)) / days;
  };
  const checkoutPricing = session?.pricing ?? {
    currency: "usd" as const,
    regularAmount: selectedPlan.amount,
    discount: activeDiscount,
    discountAmount: selectedPlan.amount - selectedIntro,
    total: selectedIntro,
    renewalAmount: selectedPlan.amount,
    billingPeriodDays: selected === "weekly" ? 7 : selected === "monthly" ? 28 : 365,
  };
  // The active session is either the confirmed one (post-click) or the preloaded one (pre-click)
  const activeSession = session ?? preloadSession;
  // Render the modal whenever it is open OR a preload session is ready (so the iframe warms up hidden)
  const shouldRenderModal = checkoutOpen || !!preloadSession;
  const checkoutModal = shouldRenderModal && <div
    className="checkout-modal-overlay"
    role="dialog"
    aria-modal={checkoutOpen}
    aria-hidden={!checkoutOpen}
    aria-label="Secure Longr checkout"
    style={!checkoutOpen ? { position: "fixed", inset: 0, opacity: 0, pointerEvents: "none", zIndex: -1 } : undefined}
  >
    <div className="checkout-modal-card checkout-payment-card" ref={checkoutCardRef} tabIndex={-1}>
      <button className="checkout-modal-close" type="button" aria-label="Close checkout" onClick={closeCheckout}><X /></button>
      <div className={`checkout-reservation${checkoutPricing.discount === 0 ? " no-discount" : ""}`}>
        <Clock3 size={18} />
        {checkoutPricing.discount > 0
          ? `Your ${checkoutPricing.discount}% discount is reserved for ${time}`
          : "Your secure checkout session is ready"}
      </div>
      <h2>Complete your Longr membership</h2>
      <p className="checkout-intro">Unlock your personalized plan and the full library of practical healthy-aging food guidance.</p>
      <div className="checkout-included-card">
        <span><Gift size={25} /></span>
        <div><strong>Full Longr access included</strong><small>Personalized plan · New short reads daily · All categories</small></div>
      </div>
      <section className="checkout-order-summary" aria-label="Order summary">
        <h3><ShieldCheck size={18} /> Safe checkout</h3>
        <dl>
          <div><dt>{selectedPlan.name} Longr membership</dt><dd>${checkoutPricing.regularAmount.toFixed(2)}</dd></div>
          {checkoutPricing.discount > 0 && <div className="checkout-discount-row"><dt>{checkoutPricing.discount}% introductory discount</dt><dd>−${checkoutPricing.discountAmount.toFixed(2)}</dd></div>}
          <div className="checkout-total-row"><dt>Total due today</dt><dd>${checkoutPricing.total.toFixed(2)}</dd></div>
        </dl>
        {checkoutPricing.discount > 0 && <p>You save ${checkoutPricing.discountAmount.toFixed(2)} today. The offer is applied automatically.</p>}
        <small>Then ${checkoutPricing.renewalAmount.toFixed(2)} every {checkoutPricing.billingPeriodDays} days until cancelled.</small>
      </section>
      <p className="checkout-security"><ShieldCheck size={17} /> Card details are entered securely in Whop checkout</p>
<div className="checkout-embed-shell">
        {activeSession ? (
          <WhopCheckoutEmbed
            sessionId={activeSession.sessionId}
            theme="light"
            themeOptions={{ accentColor: variant === "step" ? "#4f46e5" : "#139447", buttonText: "Confirm secure payment" }}
            skipRedirect
            returnUrl={`${publicAppUrl()}/hub`}
            promoCode={activeSession.promoCode ?? undefined}
            prefill={{ email: prefilledEmail.current }}
            onComplete={handleComplete}
            onPaymentError={(paymentError) => setError(paymentError.message || "Payment could not be completed.")}
          />
        ) : loading ? (
          <div className="paywall-checkout-loading">Preparing secure card form…</div>
        ) : null}
      </div>
      {error && <div className="checkout-modal-error" role="alert">{error}</div>}
      {!session && !loading && <button className="checkout-retry" type="button" onClick={() => void startCheckout()}>Try secure checkout again</button>}
      {session?.purchaseUrl && <a className="paywall-checkout-link" href={session.purchaseUrl} target="_blank" rel="noreferrer">Open secure checkout in a new tab →</a>}
    </div>
  </div>;

  if (variant === "step") return <section className="screen active paywall-screen premium-payment-screen">
    <div className="premium-payment-shell">
      <section className="premium-payment-hero">
        <div className="premium-discount-line"><Gift size={17} aria-hidden="true" /><span>{activeDiscount > 0 ? "Special welcome discount:" : "Your personalized membership"}</span>{activeDiscount > 0 && <strong>{activeDiscount}% off</strong>}</div>
        <h1>{userName ? `${userName}, your full Longr access is ready!` : "Your full Longr access is ready!"}</h1>
        <span className="premium-hero-tag"><Sparkles size={15} aria-hidden="true" /> Eat smarter for the years ahead</span>
        <p>Unlock your personalized plan plus the complete library of short, practical articles released across Longr’s healthy-aging food categories.</p>
        <div className="premium-personal-signals">
          <article><Target size={19} aria-hidden="true" /><span>Your goal</span><strong>{goal}</strong></article>
          <article><Leaf size={19} aria-hidden="true" /><span>Your first result</span><strong>{firstWin}</strong></article>
        </div>
      </section>

      <section className="premium-library-preview" aria-labelledby="library-preview-title">
        <div className="premium-library-card">
          <div className="premium-library-heading"><div><BookOpen size={20} aria-hidden="true" /><span>Full Longr article library</span></div><strong>New short reads daily</strong></div>
          <div className="premium-category-grid">{ACCESS_CATEGORIES.map(({ label, image }, index) => <article key={label} className="premium-ref-card"><img src={image} alt={label} className="premium-ref-card-bg" /><div className="premium-ref-card-gradient" /><div className="premium-ref-card-tag">Category {String(index + 1).padStart(2, "0")}</div><div className="premium-ref-card-content"><div className="premium-ref-card-title">{label}</div><div className="premium-ref-card-desc">Daily {label.toLowerCase()} guidance, swaps, and inspiration.</div><button type="button" className="premium-ref-card-btn" tabIndex={-1}>Explore</button></div></article>)}</div>
          <div className="premium-library-fade" aria-hidden="true" />
        </div>
        <h2 id="library-preview-title">One membership. Daily food guidance across every category.</h2>
        <p>Read in minutes, save what matters, and keep building from the personalized path you already created.</p>
        <div className="premium-access-ticker" aria-label="Longr library access highlights"><div>{[...ACCESS_CATEGORIES.slice(0,6),...ACCESS_CATEGORIES.slice(0,6)].map(({label},index)=><span key={`${label}-${index}`}><Check size={13} aria-hidden="true" /> {label} · Full access</span>)}</div></div>
      </section>

      {recommendations.length > 0 && <section className="premium-selected-reads"><span>Already selected for you</span><div>{recommendations.slice(0,3).map((title,index)=><article key={title}><strong>0{index+1}</strong><p>{title}</p><small>4–5 min</small></article>)}</div></section>}

      {paid ? <div className="paywall-success premium-paywall-success"><div className="paywall-success-check">✓</div><h2>You’re in!</h2><p>Payment received — opening your personalized feed…</p></div> : <section className="premium-pricing" aria-labelledby="premium-pricing-title">
        <h2 id="premium-pricing-title">Choose the best access plan for you</h2>
        {activeDiscount > 0 && <div className="premium-promo-ticket"><div><span className="premium-ticket-icon"><Gift size={18} aria-hidden="true" /></span><strong>Your {activeDiscount}% welcome discount is applied!</strong></div><div className="premium-ticket-code"><Check size={16} aria-hidden="true" /><span>Automatic first-period offer</span></div><div className="premium-ticket-time"><strong>{time}</strong><span>Minutes · Seconds</span></div></div>}

        <div className="premium-plan-grid">{[PLANS[0],PLANS[2],PLANS[1]].map(plan => { const intro = plan.amount * (1-activeDiscount/100); return <button key={plan.tier} type="button" className={`premium-plan-card${plan.recommended ? " recommended" : ""}${selected===plan.tier ? " selected" : ""}`} onClick={()=>{setSelected(plan.tier);onEvent?.("plan_selected",{tier:plan.tier});}} disabled={loading}>
          {plan.recommended && <span className="premium-most-popular">★ BEST VALUE</span>}
          <span className="premium-plan-radio" aria-hidden="true"><i /></span>
          <span className="premium-plan-name">{plan.name} access</span>
          {activeDiscount>0 && <span className="premium-plan-discount">{activeDiscount}% OFF</span>}
          <span className="premium-plan-price"><strong>${intro.toFixed(2)}</strong>{activeDiscount>0 && <del>${plan.amount.toFixed(2)}</del>}</span>
          <span className="premium-plan-equivalent">Equivalent to ${dailyEquivalent(plan).toFixed(2)} per day</span>
          <span className="premium-plan-renewal">Then {plan.renewal} until cancelled</span>
        </button>})}</div>

        <p className="premium-plan-insight"><Activity size={17} aria-hidden="true" /> The annual plan gives you the most time to turn useful reads into repeatable food habits.</p>
        <div className="premium-billing-terms">By clicking Get Full Access, you agree to pay <strong>${selectedIntro.toFixed(2)} today</strong> for {selectedPlan.name} access. Unless cancelled before the period ends, it renews at <strong>{selectedPlan.renewal}</strong>. Cancel from your profile before renewal to avoid the next charge.</div>
        <button className="premium-payment-cta" type="button" onClick={()=>void startCheckout()} disabled={loading}>{loading ? "Starting secure checkout…" : "Get Full Longr Access"}</button>
        {error && <div className="auth-error">{error}</div>}
        <div className="premium-secure-line"><ShieldCheck size={18} aria-hidden="true" /> Pay safe & secure</div>
        <div className="premium-payment-methods" aria-label="Secure payment options"><strong>VISA</strong><strong>Mastercard</strong><strong>AMEX</strong><strong>Cards & available wallets shown at checkout</strong></div>
      </section>}

      <section className="premium-payment-trust"><LockKeyhole size={18} aria-hidden="true" /><p><strong>Clear terms. Secure checkout. Cancel anytime.</strong><br />Longr provides educational food and healthy-aging content and does not replace individualized medical advice.</p></section>
      {!paid && onSkip && <button className="premium-limited-access" type="button" onClick={()=>{onEvent?.("paywall_abandoned");onSkip();}}>Continue with limited access</button>}
    </div>

    {checkoutModal}
    {abandonmentOpen && <div className="discount-claim-overlay" role="dialog" aria-modal="true" aria-labelledby="save-offer-title"><div className="discount-claim-card abandonment-card"><button className="checkout-modal-close" type="button" aria-label="Close offer" onClick={()=>setAbandonmentOpen(false)}><X /></button><div className="abandonment-gift"><Gift size={42} /></div><p className="quiz-kicker">A little more help to get started</p><h2 id="save-offer-title">Add another 10% off</h2><p>Use a total of <strong>{Math.min(45,activeDiscount+10)}% off</strong> your first billing period. The regular renewal price remains unchanged and visible before payment.</p>{error && <div className="auth-error" role="alert">{error}</div>}<button className="cta-btn" type="button" onClick={()=>void acceptSaveOffer()}>Get {Math.min(45,activeDiscount+10)}% Off</button><button className="paywall-skip" type="button" onClick={()=>setAbandonmentOpen(false)}>No thanks, return to plans</button></div></div>}
  </section>;

  const content = <>
    <span className="landing-badge"><Sparkles size={15} /> Your personalized plan</span>
    <h1 className="step-title">{userName ? `${userName}, your Longr plan is ready.` : "Your Longr plan is ready."}</h1>
    <p className="step-sub paywall-lead">Eat for the years ahead with food guidance selected around what matters most to you.</p>
    {answers && <div className="paywall-recap"><h2>Your Healthy Years plan</h2><dl>
      <div><dt>Age focus</dt><dd>{ageFocus(answers.age_bracket)}</dd></div><div><dt>Priority</dt><dd>{goal}</dd></div>
      <div><dt>Food focus</dt><dd>{answerLabel("current_food_health_focus", answers.current_food_health_focus)}</dd></div><div><dt>Biggest blocker</dt><dd>{answerLabel("primary_food_blocker", answers.primary_food_blocker)}</dd></div>
      <div><dt>First goal</dt><dd>{firstWin}</dd></div><div><dt>Reading pace</dt><dd>{answerLabel("daily_time_commitment", answers.daily_time_commitment)}</dd></div>
    </dl><p>{blockerPromise(answers.primary_food_blocker)}</p></div>}
    <section className="paywall-first-win"><span>Your first 7-day goal</span><h2>{firstWin}</h2><p>We’ll begin with short reads selected to help you reach this first.</p></section>
    {recommendations.length > 0 && <section className="paywall-content-preview"><div className="paywall-section-heading"><span>Recommended for you</span><h2>Your first reads</h2></div><div className="paywall-preview-grid">{recommendations.slice(0,3).map((title,index)=><article key={title}><span>0{index+1}</span><h3>{title}</h3><p>4–5 min read · Personalized to your answers</p></article>)}</div></section>}
    <section className="paywall-benefits"><h2>What Longr unlocks</h2><ul><li>Personalized food and healthy-aging feed</li><li>Practical swaps, labels, and preparation guidance</li><li>Heart, brain, metabolic, strength, and mobility library</li><li>A manageable weekly Healthy Years path</li><li>Saved articles and guidance matched to your interests</li></ul></section>
    <section className="paywall-comparison"><div><span>Without a clear system</span><p>Scattered posts, conflicting advice, and another search every time.</p></div><div><span>With your Longr plan</span><p>Age-relevant priorities, understandable context, and one useful next action.</p></div></section>
    {paid ? <div className="paywall-success"><div className="paywall-success-check">✓</div><h2>You’re in!</h2><p>Payment received — opening your personalized feed…</p></div> : <section className="paywall-pricing" aria-labelledby="pricing-title">
      <div className="paywall-section-heading"><span><Gift size={14} /> Choose your access</span><h2 id="pricing-title">Activate your personalized plan</h2></div>
      {activeDiscount > 0 && <div className="offer-timer"><div><Check size={18} /><span>Your {activeDiscount}% welcome discount is applied</span></div><strong><Clock3 size={17} /> {time}</strong></div>}
      <div className="paywall-plans">{PLANS.map(plan => { const intro = plan.amount * (1-activeDiscount/100); return <button key={plan.tier} type="button" className={`plan-card${plan.recommended ? " recommended" : ""}${selected===plan.tier ? " selected" : ""}`} onClick={()=>{setSelected(plan.tier);onEvent?.("plan_selected",{tier:plan.tier});}} disabled={loading}>
        {plan.recommended && <span className="plan-badge">BEST VALUE</span>}<span className="plan-name">{plan.name}</span>{activeDiscount>0 && <span className="plan-original">${plan.amount.toFixed(2)}</span>}<span className="plan-price">${intro.toFixed(2)}<span className="plan-period">{plan.period}</span></span><span className="plan-note">{plan.note}</span><span className="plan-charge">${intro.toFixed(2)} charged today; then {plan.renewal} until cancelled.</span>
      </button>})}</div>
      <button className="cta-btn paywall-primary-cta" type="button" onClick={()=>void startCheckout()} disabled={loading}>{loading ? "Starting secure checkout…" : "Get My Longr Plan"}</button>{error && <div className="auth-error">{error}</div>}
      <div className="secure-payment-row"><ShieldCheck size={17} /> Secure checkout · Cancel anytime</div>
    </section>}
    <section className="paywall-trust"><h2>Information you can use without the hype</h2><p>Longr makes healthy-aging food information easier to understand. We do not claim that one food prevents disease, treats a condition, or guarantees a longer life.</p><p className="paywall-terms">Your introductory discount applies only to the first billing period. The plan then renews at the clearly displayed regular price and frequency until cancelled.</p></section>
    {!paid && onSkip && <button className="paywall-skip" type="button" onClick={()=>{onEvent?.("paywall_abandoned");onSkip();}}>{variant === "modal" ? "Maybe later" : "Continue with limited access"}</button>}
    {checkoutModal}
    {abandonmentOpen && <div className="discount-claim-overlay" role="dialog" aria-modal="true" aria-labelledby="save-offer-title"><div className="discount-claim-card abandonment-card"><button className="checkout-modal-close" type="button" aria-label="Close offer" onClick={()=>setAbandonmentOpen(false)}><X /></button><div className="abandonment-gift"><Gift size={42} /></div><p className="quiz-kicker">A little more help to get started</p><h2 id="save-offer-title">Add another 10% off</h2><p>Use a total of <strong>{Math.min(45,activeDiscount+10)}% off</strong> your first billing period. The regular renewal price remains unchanged and visible before payment.</p>{error && <div className="auth-error" role="alert">{error}</div>}<button className="cta-btn" type="button" onClick={()=>void acceptSaveOffer()}>Get {Math.min(45,activeDiscount+10)}% Off</button><button className="paywall-skip" type="button" onClick={()=>setAbandonmentOpen(false)}>No thanks, return to plans</button></div></div>}
  </>;

  if (variant === "modal") return <div className="paywall-overlay" role="dialog" aria-modal="true" onClick={event=>{if(event.target===event.currentTarget)onClose?.();}}><div className="paywall-card"><button className="paywall-close" type="button" aria-label="Close" onClick={onClose}>&times;</button>{content}</div></div>;
  return <section className="screen active paywall-screen">{content}</section>;
}
