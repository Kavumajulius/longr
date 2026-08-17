"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, type User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Activity, ArrowRight, BookOpen, CalendarDays, CheckCircle2, ChevronRight, Clock3, Compass, Leaf, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";
import { auth, db } from "../../lib/firebase";
import { useAuth } from "../../lib/useAuth";
import { trackOnboardingEvent } from "../../lib/onboarding-analytics";
import LandingScreen from "./LandingScreen";
import QuizSteps from "./QuizSteps";
import DiscountWheel from "./DiscountWheel";
import { OnboardingInterstitial, OnboardingLoading } from "./OnboardingInterstitial";
import Paywall, { type PurchaseCompletion } from "../whop/Paywall";
import {
  ageFocus,
  answerLabel,
  blockerPromise,
  emptyAnswers,
  firstWeekPath,
  quizSteps,
  recommendationsFor,
  type OnboardingAnswers,
} from "./onboarding-data";

type Stage =
  | "landing"
  | "prep_intro"
  | "prep_trust"
  | `quiz_${number}`
  | "reassure_one"
  | "reassure_two"
  | "progress"
  | "loading"
  | "name"
  | "profile"
  | "plan"
  | "email"
  | "discount"
  | "pricing";

export default function Onboarding() {
  const router = useRouter();
  const user = useAuth();
  const [currentStage, setCurrentStage] = useState<Stage>("landing");
  const [history, setHistory] = useState<Stage[]>([]);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => {
    if (typeof window === "undefined") return emptyAnswers;
    try {
      const saved = window.localStorage.getItem("longrOnboardingAnswers");
      return saved
        ? { ...emptyAnswers, ...(JSON.parse(saved) as Partial<OnboardingAnswers>) }
        : emptyAnswers;
    } catch {
      return emptyAnswers;
    }
  });
  const [showAccount, setShowAccount] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirm, setAccountConfirm] = useState("");
  const [accountError, setAccountError] = useState("");
  const [creating, setCreating] = useState(false);
  const [accountReason, setAccountReason] = useState<"limited" | "payment">("limited");
  const [pendingPurchase, setPendingPurchase] = useState<PurchaseCompletion | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountToken, setDiscountToken] = useState<string | null>(null);
  const stageEnteredAt = useRef(0);
  const completed = useRef(false);

  const currentQuizIndex = currentStage.startsWith("quiz_")
    ? Number(currentStage.replace("quiz_", "")) - 1
    : -1;
  const currentQuiz = currentQuizIndex >= 0 ? quizSteps[currentQuizIndex] : null;
  const recommendations = useMemo(() => recommendationsFor(answers), [answers]);
  const weekPath = useMemo(() => firstWeekPath(answers), [answers]);

  useEffect(() => {
    try {
      window.localStorage.setItem("longrOnboardingAnswers", JSON.stringify(answers));
    } catch {
      // Device-local draft persistence is best effort.
    }
  }, [answers]);

  useEffect(() => {
    if (user === undefined) return;
    if (user && currentStage === "landing") router.replace("/hub");
  }, [user, router, currentStage]);

  useEffect(() => {
    stageEnteredAt.current = Date.now();
    if (currentStage === "profile") trackOnboardingEvent("profile_viewed");
    if (currentStage === "plan") trackOnboardingEvent("plan_viewed");
  }, [currentStage]);

  useEffect(() => {
    const recordDropoff = () => {
      if (completed.current || currentStage === "landing") return;
      trackOnboardingEvent("onboarding_dropoff", {
        drop_off_screen: currentStage,
        time_on_screen_ms: Date.now() - stageEnteredAt.current,
      });
    };
    window.addEventListener("pagehide", recordDropoff);
    return () => window.removeEventListener("pagehide", recordDropoff);
  }, [currentStage]);

  const goTo = useCallback((stage: Stage, skipHistory = false) => {
    setHistory((previous) => (skipHistory ? previous : [...previous, currentStage]));
    setCurrentStage(stage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStage]);
  const finishProfileLoading = useCallback(() => goTo("email"), [goTo]);

  function goBack() {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setCurrentStage(previous);
  }

  function beginOnboarding() {
    trackOnboardingEvent("onboarding_started");
    goTo("prep_intro");
  }

  function answerQuiz(value: string) {
    if (!currentQuiz) return;
    const nextAnswers = { ...answers, [currentQuiz.key]: value };
    setAnswers(nextAnswers);
    trackOnboardingEvent(`screen_${currentQuizIndex + 1}_${currentQuiz.key}_completed`, {
      selected_answer: value,
      time_on_screen_ms: Date.now() - stageEnteredAt.current,
    });

    if (currentQuizIndex === quizSteps.length - 1) {
      trackOnboardingEvent("quiz_completed");
      goTo("progress");
    } else if (currentQuizIndex === 4) {
      goTo("reassure_one");
    } else if (currentQuizIndex === 10) {
      goTo("reassure_two");
    } else {
      goTo(`quiz_${currentQuizIndex + 2}`);
    }
  }

  function skipOptionalQuestion() {
    if (!currentQuiz?.optional) return;
    trackOnboardingEvent(`screen_${currentQuizIndex + 1}_${currentQuiz.key}_completed`, {
      selected_answer: "skipped",
      time_on_screen_ms: Date.now() - stageEnteredAt.current,
    });
    goTo(`quiz_${currentQuizIndex + 2}`);
  }

  function saveCompletion() {
    completed.current = true;
    try {
      localStorage.setItem("longrOnboarded", "true");
      localStorage.setItem("longrUserName", answers.first_name);
      localStorage.setItem("longrOnboardingAnswers", JSON.stringify(answers));
      localStorage.setItem("longrRecommendations", JSON.stringify(recommendations));
      localStorage.setItem("longrFirstWeekPath", JSON.stringify(weekPath));
      localStorage.setItem("longrUnlocked", JSON.stringify([1, 2, 3, 4]));
    } catch {
      // The authenticated profile remains the durable source when available.
    }
  }

  function finishOnboarding() {
    saveCompletion();
    router.push("/hub");
  }

  function openAccountModal(reason: "limited" | "payment") {
    setAccountReason(reason);
    setAccountEmail(answers.email);
    setAccountPassword("");
    setAccountConfirm("");
    setAccountError("");
    setShowAccount(true);
  }

  function rememberPendingPurchase(purchase: PurchaseCompletion) {
    setPendingPurchase(purchase);
    try {
      localStorage.setItem("longrPendingWhopPurchase", JSON.stringify(purchase));
    } catch {
      // The verified receipt can still be claimed during this session.
    }
  }

  async function claimPurchase(account: User, purchase: PurchaseCompletion) {
    const idToken = await account.getIdToken();
    const response = await fetch("/api/whop/claim-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, receiptId: purchase.receiptId }),
    });
    const text = await response.text(); // defensive: read as raw text first
    try {
      const result = JSON.parse(text) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to link the completed payment.");
      }
      try {
        localStorage.removeItem("longrPendingWhopPurchase");
      } catch {
        // Best effort cleanup.
      }
    } catch (err) {
      console.error("Failed to parse JSON. Received HTML instead:", text);
      throw new Error("Unable to link the completed payment.");
    }
  }

  async function handlePaymentComplete(purchase: PurchaseCompletion) {
    rememberPendingPurchase(purchase);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      openAccountModal("payment");
      return;
    }

    try {
      await claimPurchase(currentUser, purchase);
    } catch (error) {
      console.error("[onboarding] paid membership is awaiting reconciliation", error);
      await setDoc(doc(db, "users", currentUser.uid), {
        purchaseVerificationPending: purchase.receiptId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    finishOnboarding();
  }

  function handleLimitedAccess() {
    if (auth.currentUser) {
      finishOnboarding();
      return;
    }
    setPendingPurchase(null);
    openAccountModal("limited");
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountError("");
    if (!accountEmail.trim().includes("@")) {
      setAccountError("Please enter a valid email address.");
      return;
    }
    if (accountPassword.length < 6) {
      setAccountError("Password must be at least 6 characters.");
      return;
    }
    if (accountPassword !== accountConfirm) {
      setAccountError("Passwords don’t match.");
      return;
    }

    setCreating(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        accountEmail.trim(),
        accountPassword,
      );
      const finalAnswers = { ...answers, email: accountEmail.trim() };
      setAnswers(finalAnswers);
      await setDoc(doc(db, "users", credential.user.uid), {
        ...finalAnswers,
        healthyYearsProfile: {
          ageFocus: ageFocus(finalAnswers.age_bracket),
          futurePriority: answerLabel("primary_future_goal", finalAnswers.primary_future_goal),
          foodFocus: answerLabel("current_food_health_focus", finalAnswers.current_food_health_focus),
          blocker: answerLabel("primary_food_blocker", finalAnswers.primary_food_blocker),
          firstWin: answerLabel("first_week_win", finalAnswers.first_week_win),
          pace: answerLabel("daily_time_commitment", finalAnswers.daily_time_commitment),
        },
        recommendations: recommendationsFor(finalAnswers),
        firstWeekPath: firstWeekPath(finalAnswers),
        completedOnboardingQuiz: true,
        createdAt: serverTimestamp(),
      });

      if (accountReason === "payment" && pendingPurchase) {
        try {
          await claimPurchase(credential.user, pendingPurchase);
        } catch (error) {
          console.error("[onboarding] paid membership is awaiting reconciliation", error);
          await setDoc(doc(db, "users", credential.user.uid), {
            purchaseVerificationPending: pendingPurchase.receiptId,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }

      setShowAccount(false);
      setCreating(false);
      finishOnboarding();
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
      setAccountError(
        code === "auth/email-already-in-use"
          ? "An account already exists with this email. Log in, then return to activate your plan."
          : code === "auth/operation-not-allowed"
            ? "Email/password sign-up is not enabled yet."
            : "Something went wrong. Please try again.",
      );
      setCreating(false);
    }
  }

  const showBack = currentStage !== "landing" && currentStage !== "pricing" && history.length > 0;

  return (
    <div className={`onboarding-root onboarding-stage-${currentStage}`}>
      <header className="onb-header">
        <button className={`back-btn ${showBack ? "" : "hidden"}`} onClick={goBack} aria-label="Go back">
          ←
        </button>
        <img src="/logo.png" alt="LONGR" className="onb-logo" />
        {currentQuiz && (
          <span className="progress-label">{currentQuizIndex + 1} of 16</span>
        )}
      </header>

      {currentQuiz && (
        <div className="longr-progress" aria-label={`Question ${currentQuizIndex + 1} of 16`}>
          <span style={{ width: `${((currentQuizIndex + 1) / 16) * 100}%` }} />
        </div>
      )}

      <main className={currentStage === "landing" ? "onb-main-landing" : "onb-main refined-onboarding"}>
        {currentStage === "landing" && <LandingScreen onNext={beginOnboarding} />}

        {currentStage === "prep_intro" && <OnboardingInterstitial kind="prep_intro" onContinue={() => goTo("prep_trust")} />}
        {currentStage === "prep_trust" && <OnboardingInterstitial kind="prep_trust" onContinue={() => goTo("quiz_1")} />}
        {currentStage === "reassure_one" && <OnboardingInterstitial kind="reassure_one" onContinue={() => goTo("quiz_6")} />}
        {currentStage === "reassure_two" && <OnboardingInterstitial kind="reassure_two" onContinue={() => goTo("quiz_12")} />}
        {currentStage === "progress" && <OnboardingInterstitial kind="progress" onContinue={() => goTo("loading")} />}
        {currentStage === "loading" && <OnboardingLoading onComplete={finishProfileLoading} />}

        {currentQuiz && (
          <QuizSteps
            step={currentQuiz}
            stepNumber={currentQuizIndex + 1}
            answers={answers}
            onAnswer={answerQuiz}
            onSkip={skipOptionalQuestion}
          />
        )}

        {currentStage === "name" && (
          <section className="screen active compact-form-screen">
            <p className="quiz-kicker">Your answers are ready.</p>
            <h1 className="step-title">What should we call you?</h1>
            <p className="step-sub">We’ll use your first name to personalize your Longr plan.</p>
            <label className="field-label" htmlFor="first-name">First name</label>
            <input id="first-name" className="input-text" value={answers.first_name} onChange={(event) => setAnswers({ ...answers, first_name: event.target.value })} autoComplete="given-name" />
            <button className="cta-btn" type="button" disabled={!answers.first_name.trim()} onClick={() => {
              trackOnboardingEvent("name_submitted");
              goTo("profile");
            }}>See My Healthy Years Profile</button>
          </section>
        )}

        {currentStage === "profile" && (
          <HealthyYearsProfile answers={answers} onContinue={() => goTo("plan")} />
        )}

        {currentStage === "plan" && (
          <PersonalizedPlan answers={answers} recommendations={recommendations} weekPath={weekPath} onContinue={() => goTo("discount")} />
        )}

        {currentStage === "email" && (
          <section className="screen active compact-form-screen">
            <p className="quiz-kicker">Save your personalized path.</p>
            <h1 className="step-title">Where should we send your Longr plan?</h1>
            <p className="step-sub">Save your Healthy Years Profile and continue the reading path selected for your goals.</p>
            <label className="field-label" htmlFor="plan-email">Email address</label>
            <input id="plan-email" className="input-text" type="email" value={answers.email} onChange={(event) => setAnswers({ ...answers, email: event.target.value })} autoComplete="email" inputMode="email" placeholder="you@email.com" />
            <button className="cta-btn" type="button" disabled={!answers.email.includes("@") || answers.email.length < 5} onClick={() => {
              trackOnboardingEvent("email_submitted");
              goTo("name");
            }}>Continue to My Plan</button>
            <p className="form-trust">No spam. You control your email preferences. Your answers personalize Longr.</p>
          </section>
        )}

        {currentStage === "discount" && (
          <DiscountWheel userName={answers.first_name} onEvent={trackOnboardingEvent} onClaim={(value, token) => {
            setDiscount(value);
            setDiscountToken(token);
            trackOnboardingEvent("discount_claimed", { discount: value });
            goTo("pricing");
          }} />
        )}

        {currentStage === "pricing" && (
          <Paywall
            variant="step"
            userEmail={user?.email ?? answers.email}
            userName={answers.first_name || user?.displayName}
            answers={answers}
            recommendations={recommendations}
            discount={discount}
            discountToken={discountToken}
            onPaid={(purchase) => void handlePaymentComplete(purchase)}
            onSkip={handleLimitedAccess}
            onEvent={trackOnboardingEvent}
          />
        )}
      </main>

      {showAccount && (
        <div className="auth-overlay" onClick={() => !creating && setShowAccount(false)}>
          <div className="auth-card" onClick={(event) => event.stopPropagation()}>
            <h2>{accountReason === "payment" ? "Secure your paid Longr membership" : "Save your Longr profile"}</h2>
            <p>{accountReason === "payment"
              ? "Payment received. Create a password to connect your membership, profile, and recommendations to your account."
              : "Create a password to keep your profile and limited-access recommendations available across devices."}</p>
            <form onSubmit={createAccount}>
              <input className="auth-input" type="email" autoComplete="email" value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} placeholder="you@email.com" />
              <input className="auth-input" type="password" autoComplete="new-password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} placeholder="Create a password" />
              <input className="auth-input" type="password" autoComplete="new-password" value={accountConfirm} onChange={(event) => setAccountConfirm(event.target.value)} placeholder="Confirm your password" />
              {accountError && <div className="auth-error">{accountError}</div>}
              <button className="auth-btn" type="submit" disabled={creating}>{creating ? "Saving your plan…" : accountReason === "payment" ? "Create account & open membership" : "Create account & continue"}</button>
            </form>
            {accountError.includes("already exists") ? <a className="auth-link" href="/login">Log in instead</a> : (
              <button className="auth-close" type="button" disabled={creating} onClick={() => setShowAccount(false)}>Back to plans</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HealthyYearsProfile({ answers, onContinue }: { answers: OnboardingAnswers; onContinue: () => void }) {
  const clarity = ["always", "often"].includes(answers.nutrition_overwhelm_level)
    ? "You want clarity without nutrition noise"
    : ["not_very", "dont_know", "unsure_several"].includes(answers.food_choice_confidence)
      ? "You want a clearer everyday starting point"
      : "You’re ready to refine informed food choices";
  const rows = [
    ["Future priority", answerLabel("deep_future_priority", answers.deep_future_priority)],
    ["Current focus", answerLabel("current_food_health_focus", answers.current_food_health_focus)],
    ["Food clarity", clarity],
    ["Biggest friction", answerLabel("primary_food_blocker", answers.primary_food_blocker)],
    ["First practical focus", answerLabel("first_food_use_case", answers.first_food_use_case)],
    ["Learning pace", answerLabel("daily_time_commitment", answers.daily_time_commitment)],
  ];
  const initial = answers.first_name.trim().charAt(0).toUpperCase() || "Y";
  return (
    <section className="screen active profile-screen">
      <div className="healthy-profile-dashboard">
        <nav className="profile-dashboard-nav" aria-label="Profile sections">
          <div className="profile-dashboard-brand"><Leaf size={17} aria-hidden="true" /><span>Longr profile</span></div>
          <div className="profile-dashboard-tabs" aria-hidden="true"><span className="active">Overview</span><span>Focus areas</span><span>First step</span></div>
          <div className="profile-private"><ShieldCheck size={15} aria-hidden="true" /> Private profile</div>
        </nav>

        <header className="profile-dashboard-heading">
          <div className="profile-avatar" aria-hidden="true">{initial}</div>
          <div>
            <p className="quiz-kicker">Your Healthy Years Profile</p>
            <h1 className="step-title">{answers.first_name}, here’s where Longr can help most.</h1>
          </div>
          <div className="profile-complete"><CheckCircle2 size={17} aria-hidden="true" /><span>Profile complete</span></div>
        </header>

        <p className="profile-dashboard-disclaimer">This is a content-personalization profile, not a diagnosis or health-risk score.</p>

        <div className="profile-dashboard-grid">
          <aside className="profile-overview-column" aria-label="Profile overview">
            <div className="profile-age-selector"><span className="profile-mini-icon"><Compass size={18} aria-hidden="true" /></span><div><small>Age focus</small><strong>{ageFocus(answers.age_bracket)}</strong></div><span className="profile-selector-arrow" aria-hidden="true">⌄</span></div>
            <div className="profile-signal-count"><strong>{rows.length}</strong><span>personalized signals<br />connected</span></div>
            <article className="profile-activity-card">
              <div className="profile-card-label"><span>Path activity</span><span className="profile-live-pill">Ready</span></div>
              <dl>
                <div><dt>Priority</dt><dd>{rows[0][1]}</dd></div>
                <div><dt>First focus</dt><dd>{rows[4][1]}</dd></div>
                <div><dt>Pace</dt><dd>{rows[5][1]}</dd></div>
              </dl>
            </article>
          </aside>

          <section className="profile-recommendation-column" aria-label="Longr recommendation">
            <article className="profile-primary-card">
              <div className="profile-card-label"><span><Sparkles size={15} aria-hidden="true" /> Your Longr recommendation</span><span className="profile-personalized-pill">Personalized</span></div>
              <p>{blockerPromise(answers.primary_food_blocker)} Start with age-relevant food decisions you can use immediately, then build one small habit at a time.</p>
              <div className="profile-card-proof"><span><CheckCircle2 size={14} aria-hidden="true" /> Based on your answers</span><span><ShieldCheck size={14} aria-hidden="true" /> Educational guidance</span></div>
            </article>

            <article className="profile-start-card">
              <span className="profile-card-icon"><Target size={19} aria-hidden="true" /></span>
              <div><small>First practical focus</small><strong>{rows[4][1]}</strong></div>
              <span className="profile-start-pill">Start here</span>
            </article>

            <article className="profile-pace-card">
              <span className="profile-card-icon"><Clock3 size={19} aria-hidden="true" /></span>
              <div><small>Your learning pace</small><strong>{rows[5][1]}</strong></div>
              <span className="profile-gentle-pill">At your pace</span>
            </article>
          </section>

          <aside className="profile-focus-column" aria-label="Your focus areas">
            <section className="profile-focus-list">
              <div className="profile-focus-heading"><span>Your focus areas</span><small>4 signals</small></div>
              {rows.slice(0, 4).map(([label, value], index) => <div className="profile-focus-row" key={label}><span>{value}</span><span className={`profile-focus-dot profile-focus-dot-${index + 1}`} aria-hidden="true" /></div>)}
            </section>
            <section className="profile-guidance-card">
              <div><ShieldCheck size={20} aria-hidden="true" /><span>Responsible guidance</span></div>
              <strong>Helpful direction,<br />never a diagnosis.</strong>
              <div className="profile-guidance-wave" aria-hidden="true">{[12,22,15,30,18,35,24,15,29,20,32,14].map((height, index) => <i key={index} style={{ height }} />)}</div>
            </section>
          </aside>
        </div>

        <footer className="profile-dashboard-footer">
          <div><span>Next step</span><strong>Turn this profile into your first Longr plan.</strong></div>
          <button className="profile-build-btn" type="button" onClick={onContinue}>Build My Longr Plan <ArrowRight size={18} aria-hidden="true" /></button>
        </footer>
      </div>
    </section>
  );
}

function PersonalizedPlan({ answers, recommendations, weekPath, onContinue }: { answers: OnboardingAnswers; recommendations: string[]; weekPath: string[]; onContinue: () => void }) {
  const goal = answerLabel("primary_future_goal", answers.primary_future_goal);
  const pace = answerLabel("daily_time_commitment", answers.daily_time_commitment);
  const foodFocus = answerLabel("current_food_health_focus", answers.current_food_health_focus);
  const firstAction = weekPath[0]?.replace(/^Day 1\s*[—-]\s*/, "") ?? "Choose one practical first step";
  return (
    <section className="screen active personalized-plan-screen">
      <div className="plan-report-dashboard">
        <nav className="plan-report-topbar" aria-label="Plan report sections">
          <div className="plan-report-brand"><Leaf size={19} aria-hidden="true" /><strong>Longr</strong><span>Personal plan</span></div>
          <div className="plan-report-tabs" aria-hidden="true"><span className="active">Report</span><span>7-day path</span><span>Reading</span></div>
          <div className="plan-report-status"><CheckCircle2 size={16} aria-hidden="true" /> Ready for you</div>
        </nav>

        <div className="plan-report-hero">
          <div>
            <p className="quiz-kicker">Built around your answers</p>
            <h1 className="step-title">Your plan for eating for the years ahead is ready.</h1>
            <p>Built around your goal to <strong>{goal.toLowerCase()}</strong>.</p>
          </div>
          <div className="plan-report-metrics" aria-label="Plan summary">
            <div><strong>7</strong><span>guided<br />days</span></div>
            <div><strong>{recommendations.length}</strong><span>selected<br />reads</span></div>
            <div><strong>{pace}</strong><span>daily<br />pace</span></div>
          </div>
        </div>

        <div className="plan-report-body">
          <aside className="plan-report-rail" aria-hidden="true">
            <span className="active"><Activity size={17} /></span><span><TrendingUp size={17} /></span><span><CalendarDays size={17} /></span><span><BookOpen size={17} /></span><span><ShieldCheck size={17} /></span>
          </aside>

          <div className="plan-report-grid">
            <section className="plan-report-card plan-mix-card" aria-labelledby="plan-mix-title">
              <div className="plan-card-heading"><div><span>Plan composition</span><h2 id="plan-mix-title">Your first-week mix</h2></div><span className="plan-card-menu" aria-hidden="true">•••</span></div>
              <div className="plan-mix-content">
                <div className="plan-ring-graphic" role="img" aria-label="A balanced plan combining food focus, practical action, and learning">
                  <svg viewBox="0 0 150 150" aria-hidden="true">
                    <circle className="plan-ring-track" cx="75" cy="75" r="55" pathLength="100" />
                    <circle className="plan-ring-segment plan-ring-food" cx="75" cy="75" r="55" pathLength="100" />
                    <circle className="plan-ring-segment plan-ring-action" cx="75" cy="75" r="55" pathLength="100" />
                    <circle className="plan-ring-segment plan-ring-learning" cx="75" cy="75" r="55" pathLength="100" />
                  </svg>
                  <div><strong>7</strong><span>days</span></div>
                </div>
                <div className="plan-mix-legend">
                  <div><i className="food" /><span>Food focus</span><strong>{foodFocus}</strong></div>
                  <div><i className="action" /><span>First action</span><strong>{firstAction}</strong></div>
                  <div><i className="learning" /><span>Learning</span><strong>{pace} a day</strong></div>
                </div>
              </div>
            </section>

            <section className="plan-report-card plan-momentum-card" aria-labelledby="plan-momentum-title">
              <div className="plan-card-heading"><div><span>Your week at a glance</span><h2 id="plan-momentum-title">A realistic rhythm that builds</h2></div><span className="plan-trend-pill"><TrendingUp size={14} aria-hidden="true" /> One step daily</span></div>
              <div className="plan-chart-wrap" role="img" aria-label="Seven-day path rising gradually from one clear start to a repeatable routine">
                <svg viewBox="0 0 560 205" preserveAspectRatio="none" aria-hidden="true">
                  <defs><linearGradient id="planAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3290f5" stopOpacity=".28" /><stop offset="100%" stopColor="#3290f5" stopOpacity="0" /></linearGradient></defs>
                  {[36,76,116,156].map(y => <line className="plan-chart-gridline" key={y} x1="24" x2="536" y1={y} y2={y} />)}
                  <path className="plan-chart-area" d="M24 157 C78 155 96 148 126 143 S188 132 213 121 S270 111 299 104 S353 77 386 69 S447 55 474 43 S514 32 536 27 L536 180 L24 180 Z" />
                  <path className="plan-chart-line" d="M24 157 C78 155 96 148 126 143 S188 132 213 121 S270 111 299 104 S353 77 386 69 S447 55 474 43 S514 32 536 27" />
                  {[[24,157],[109,146],[194,128],[280,109],[365,75],[450,52],[536,27]].map(([cx,cy], index) => <circle className="plan-chart-point" style={{ animationDelay: `${.55 + index * .1}s` }} key={cx} cx={cx} cy={cy} r="5" />)}
                </svg>
                <div className="plan-chart-callout"><span>Day 7</span><strong>Repeatable routine</strong></div>
                <div className="plan-chart-days" aria-hidden="true">{["D1","D2","D3","D4","D5","D6","D7"].map(day => <span key={day}>{day}</span>)}</div>
              </div>
            </section>

            <section className="plan-report-card plan-week-card" aria-labelledby="plan-week-title">
              <div className="plan-card-heading"><div><span>Guided path</span><h2 id="plan-week-title">Your first 7 days</h2></div><span className="plan-week-count">7 / 7 mapped</span></div>
              <ol className="plan-week-timeline">{weekPath.map((item, index) => {
                const [day, ...description] = item.split("—");
                return <li key={item} style={{ animationDelay: `${.12 + index * .08}s` }}><span className="plan-day-node">{index + 1}</span><div><small>{day.trim()}</small><strong>{description.join("—").trim() || item}</strong></div>{index === 0 && <span className="plan-now-pill">Begin here</span>}</li>;
              })}</ol>
            </section>

            <section className="plan-report-card plan-reading-card" aria-labelledby="plan-reading-title">
              <div className="plan-card-heading"><div><span>Chosen for your answers</span><h2 id="plan-reading-title">Selected for you</h2></div><BookOpen size={19} aria-hidden="true" /></div>
              <div className="plan-reading-list">{recommendations.map((item,index)=><article key={item}><span className={`plan-read-number plan-read-${index + 1}`}>0{index+1}</span><div><small>4–5 min read</small><h3>{item}</h3></div><ChevronRight size={17} aria-hidden="true" /></article>)}</div>
              <div className="plan-shift-summary"><span>What changes</span><div><p><small>Today</small>Nutrition noise and no clear next step</p><ArrowRight size={18} aria-hidden="true" /><p><small>With Longr</small>One useful decision, then one small habit</p></div></div>
            </section>
          </div>
        </div>

        <footer className="plan-report-footer">
          <p><ShieldCheck size={16} aria-hidden="true" /> Longr provides educational food and healthy-aging content. It does not diagnose, treat, or replace individualized medical advice.</p>
          <button type="button" onClick={onContinue}>Send Me My Plan <ArrowRight size={18} aria-hidden="true" /></button>
        </footer>
      </div>
      <p className="quiz-kicker">Built around your answers</p>
      <h1 className="step-title">Your plan for eating for the years ahead is ready.</h1>
      <p className="step-sub">Built around your goal to {answerLabel("primary_future_goal", answers.primary_future_goal).toLowerCase()}.</p>
      <div className="plan-transformation">
        <div><span>Today</span><ul><li>Conflicting food advice</li><li>Unsure what matters most now</li><li>Good intentions without a clear next step</li></ul></div>
        <div><span>With your Longr plan</span><ul><li>Age-relevant food guidance</li><li>Short reads selected for your priorities</li><li>Clear actions and a first-week goal</li></ul></div>
      </div>
      <div className="plan-columns">
        <section><h2>Your first 7 days</h2><ol>{weekPath.map((item) => <li key={item}>{item}</li>)}</ol></section>
        <section><h2>Selected for you</h2>{recommendations.map((item) => <article key={item}><span>4–5 min</span><h3>{item}</h3></article>)}</section>
      </div>
      <p className="medical-microcopy">Longr provides educational food and healthy-aging content. It does not diagnose, treat, or replace individualized medical advice.</p>
      <button className="cta-btn" type="button" onClick={onContinue}>Send Me My Plan</button>
    </section>
  );
}
