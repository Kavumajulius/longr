"use client";

import { Crown, Gem, Triangle } from "lucide-react";
import { useEffect, useState } from "react";

const DISCOUNTS = [10, 15, 20, 25, 30, 35];

export default function DiscountWheel({ userName, onClaim, onEvent }: { userName?: string; onClaim: (discount: number, token: string) => void; onEvent?: (name: string, details?: Record<string, unknown>) => void; }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState<number | null>(null);
  const [offerToken, setOfferToken] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { onEvent?.("discount_wheel_viewed"); }, [onEvent]);
  async function spin() {
    if (spinning || won) return;
    setSpinning(true);
    setError("");
    onEvent?.("discount_wheel_spun");
    try {
      const response = await fetch("/api/whop/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "spin" }),
      });
      const text = await response.text(); // defensive: read as raw text first
      try {
        if (!response.ok) {
          return setError(text || "Your offer could not be prepared.");
        }
        const result = JSON.parse(text) as { discount?: number; token?: string; error?: string };
        if (typeof result.discount !== "number" || !result.token) {
          throw new Error(result.error || "Your offer could not be prepared.");
        }
        const index = DISCOUNTS.indexOf(result.discount);
        if (index < 0) throw new Error("The offer result was invalid.");
        const segment = 360 / DISCOUNTS.length;
        setRotation(1440 + (360 - (index * segment + segment / 2)));
        setOfferToken(result.token);
        window.setTimeout(() => {
          setWon(result.discount!);
          setSpinning(false);
          onEvent?.("discount_awarded", { discount: result.discount });
        }, 2600);
      } catch (offerError) {
        setSpinning(false);
        setError(offerError instanceof Error ? offerError.message : "Your offer could not be prepared.");
      }
    } catch (offerError) {
      setSpinning(false);
      setError(offerError instanceof Error ? offerError.message : "Your offer could not be prepared.");
    }
  }
  return (
    <section className="screen active discount-wheel-screen">
      <span className="landing-badge discount-premium-badge"><Gem size={16} /> A premium welcome offer for your plan</span>
      <h1 className="step-title">Spin to unlock your Longr welcome discount</h1>
      <p className="step-sub">One spin. Your result will be applied transparently to the first billing period of whichever plan you choose.</p>
      <div className={`wheel-wrap ${spinning ? "is-spinning" : ""} ${won !== null ? "has-winner" : ""}`}><div className="discount-wheel" style={{ transform: `rotate(${rotation}deg)` }}>
        {DISCOUNTS.map((value, index) => <span key={value} style={{ transform: `rotate(${index * 60 + 30}deg) translateY(-116px)` }}>{value}%</span>)}
      </div><div className="wheel-center" aria-label={won !== null ? `Pointer indicates ${won}% discount` : "Discount selection pointer"}><Triangle size={30} fill="currentColor" strokeWidth={2.4} /></div></div>
      <button className="cta-btn wheel-spin-button" type="button" disabled={spinning || won !== null} onClick={spin}>{spinning ? "Finding your offer…" : won ? `${won}% unlocked` : "Spin the Wheel"}</button>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <p className="form-trust">The possible discount range is 10%–35%. The selected price and renewal terms will be shown before payment.</p>
      {won !== null && <div className="discount-claim-overlay" role="dialog" aria-modal="true" aria-labelledby="discount-title"><div className="discount-claim-card">
        <div className="discount-confetti"><Crown size={31} fill="currentColor" /></div><p className="quiz-kicker">Your premium welcome offer</p><h2 id="discount-title">Great news{userName ? `, ${userName}` : ""}!</h2>
        <div className="discount-result"><strong>{won}% off</strong><span>your first billing period</span></div><p>It will be applied automatically and shown in your secure checkout.</p>
        <button className="cta-btn discount-claim-button" type="button" onClick={() => onClaim(won, offerToken)}>Claim My Discount</button>
      </div></div>}
    </section>
  );
}
