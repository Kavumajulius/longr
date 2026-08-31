"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";
import { MdContentCopy, MdEmail } from "react-icons/md";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { categories, type Category } from "./longr-data";
import type { LongrArticle } from "./articles/types";
import Paywall from "@/components/whop/Paywall";
import HeroSubtitle from "@/components/HeroSubtitle";

type FeedMode = "all" | "workouts";
type ShareTarget = "linkedin" | "whatsapp" | "x" | "facebook" | "email" | "copy";

const workoutCategories = new Set<Category>([
  "Cardio",
  "Strength",
  "Yoga",
  "Mobility",
]);

const FREE_LIMIT = 4;

export default function LongrHub({
  articles,
  featuredArticles,
}: {
  articles: LongrArticle[];
  featuredArticles: LongrArticle[];
}) {
  const [activeCategory, setActiveCategory] = useState<Category | null>("All");
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<LongrArticle | null>(
    null,
  );
  const [articleCategory, setArticleCategory] = useState<Category | null>(null);
  const [savedArticles, setSavedArticles] = useState<Set<number>>(new Set());
  const [promoOpen, setPromoOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const router = useRouter();
  const user = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const categoriesRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) router.replace("/login");
  }, [user, router]);

  useEffect(() => {
    if (user === undefined || user === null) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      setSubscribed(snapshot.data()?.subscribed === true);
    });
    return unsubscribe;
  }, [user]);

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setPromoOpen(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("longr-saved-articles");
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored) as number[];
        setSavedArticles(new Set(parsed));
      } catch {
        window.localStorage.removeItem("longr-saved-articles");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const articleId = Number(params.get("article"));
      const categoryParam = params.get("category");

      if (Number.isInteger(articleId) && articleId > 0) {
        const article = articles.find((item) => item.id === articleId);
        if (article) {
          setSelectedArticle(article);
          setArticleCategory(null);
          return;
        }
      }

      const category = categories.find((item) => item === categoryParam);
      if (category && category !== "All") {
        const firstArticle = articles.find(
          (item) => item.category === category,
        );
        if (firstArticle) {
          setSelectedArticle(firstArticle);
          setArticleCategory(category);
        }
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [articles]);

  useEffect(() => {
    document.body.style.overflow = selectedArticle ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedArticle]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedArticle) {
        setSelectedArticle(null);
        setArticleCategory(null);
      }
      else if (promoOpen) setPromoOpen(false);
      else {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [promoOpen, selectedArticle]);

  const visibleArticles = useMemo(() => {
    let filtered = articles;

    if (feedMode === "workouts") {
      filtered = filtered.filter((article) =>
        workoutCategories.has(article.category),
      );
    } else if (activeCategory && activeCategory !== "All") {
      filtered = filtered.filter(
        (article) => article.category === activeCategory,
      );
    }

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return filtered;

    return filtered.filter((article) =>
      [article.headline, article.category, article.subheadline].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [activeCategory, articles, feedMode, query]);

  const relatedArticles = useMemo(() => {
    if (!selectedArticle) return [];

    if (articleCategory) {
      return [...articles]
        .filter((article) => article.category !== articleCategory)
        .sort((first, second) => (second.id ?? 0) - (first.id ?? 0))
        .slice(0, 6);
    }

    const sameCategory = articles.filter(
      (article) =>
        article.category === selectedArticle.category &&
        article.id !== selectedArticle.id,
    );
    const extras = articles.filter(
      (article) =>
        article.id !== selectedArticle.id &&
        !sameCategory.some((related) => related.id === article.id),
    );

    return [...sameCategory, ...extras].slice(0, 6);
  }, [articleCategory, articles, selectedArticle]);

  const categoryArticles = useMemo(() => {
    if (!articleCategory) return [];
    return [...articles]
      .filter((article) => article.category === articleCategory)
      .sort((first, second) => (second.id ?? 0) - (first.id ?? 0));
  }, [articleCategory, articles]);

  const isFree = user !== null && user !== undefined && !subscribed;

  const freeIds = useMemo(
    () => new Set(articles.slice(0, FREE_LIMIT).map((a) => a.id ?? 0)),
    [articles],
  );

  const isLocked = (article: LongrArticle) =>
    isFree && article.id !== undefined && !freeIds.has(article.id);

  function scrollToFeed() {
    window.requestAnimationFrame(() => {
      document
        .getElementById("daily-feed")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function selectCategory(category: Category) {
    setActiveCategory(category);
    setFeedMode("all");
  }

  function applyHeaderFilter(mode: FeedMode, category?: Category) {
    setQuery("");
    setFeedMode(mode);
    setActiveCategory(category ?? null);
    if (category) setFeedMode("all");
    scrollToFeed();
  }

  function openArticle(article: LongrArticle) {
    if (isLocked(article)) {
      setUpgradeOpen(true);
      return;
    }
    setSelectedArticle(article);
    setArticleCategory(null);
    setShareFeedback("");
  }

  function browseArticleCategory(category: Category) {
    if (category === "All") return;
    setArticleCategory(category);
    setShareFeedback("");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedMode("all");
    setActiveCategory("All");
    setSearchOpen(false);
    scrollToFeed();
  }

  function scrollCategories() {
    const row = categoriesRef.current;
    if (!row) return;

    const maxScroll = row.scrollWidth - row.clientWidth;
    row.scrollTo({
      left:
        row.scrollLeft >= maxScroll - 5
          ? 0
          : row.scrollLeft + row.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  function saveSelectedArticle() {
    if (!selectedArticle || selectedArticle.id === undefined) return;

    setSavedArticles((current) => {
      const next = new Set(current);
      next.add(selectedArticle.id as number);
      window.localStorage.setItem(
        "longr-saved-articles",
        JSON.stringify([...next]),
      );
      return next;
    });
  }

  function dismissPromo(event?: MouseEvent<HTMLDivElement>) {
    if (event && event.target !== event.currentTarget) return;
    setPromoOpen(false);
  }

  function closeArticleView() {
    setSelectedArticle(null);
    setArticleCategory(null);
    setShareFeedback("");
  }

  function getShareDetails() {
    const url = new URL(window.location.origin + window.location.pathname);

    if (articleCategory) {
      url.searchParams.set("category", articleCategory);
      return {
        title: `${articleCategory} articles on LONGR`,
        text: `Explore recent ${articleCategory.toLowerCase()} articles on LONGR.`,
        url: url.toString(),
      };
    }

    const article = selectedArticle ?? articles[0];
    url.searchParams.set("article", String(article.id));
    return {
      title: article.headline,
      text: `${article.headline} — ${article.subheadline}`,
      url: url.toString(),
    };
  }

  async function shareArticle(target: ShareTarget) {
    const details = getShareDetails();
    const encodedUrl = encodeURIComponent(details.url);
    const encodedTitle = encodeURIComponent(details.title);
    const encodedText = encodeURIComponent(details.text);

    if (target === "copy") {
      try {
        await navigator.clipboard.writeText(details.url);
        setShareFeedback("Link copied");
      } catch {
        window.prompt("Copy this LONGR link", details.url);
        setShareFeedback("Link ready to copy");
      }
      window.setTimeout(() => setShareFeedback(""), 2200);
      return;
    }

    const shareUrls: Record<Exclude<ShareTarget, "copy">, string> = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
    };

    if (target === "email") {
      window.location.href = shareUrls.email;
      return;
    }

    window.open(shareUrls[target], "_blank", "noopener,noreferrer");
  }

  const selectedIsSaved = selectedArticle
    ? selectedArticle.id !== undefined &&
      savedArticles.has(selectedArticle.id)
    : false;

  return (
    <main>
      <div className="background-wrapper">
        <header>
          <div className="nav-left">
            <button
              className="logo"
              type="button"
              onClick={() => applyHeaderFilter("all", "All")}
              aria-label="LONGR home"
            >
              LONGR
            </button>
          </div>
          <nav className="nav-links" aria-label="Primary navigation">
            <button
              type="button"
              onClick={() => applyHeaderFilter("all", "Longevity")}
            >
              LONGEVITY
            </button>
            <button
              type="button"
              onClick={() => applyHeaderFilter("all", "Sleep")}
              style={{ opacity: 0.7 }}
            >
              SLEEP
            </button>
            <button
              type="button"
              onClick={() => applyHeaderFilter("all", "Fasting")}
              style={{ opacity: 0.7 }}
            >
              FASTING
            </button>
            <button
              type="button"
              onClick={() => applyHeaderFilter("all", "Nutrition")}
              style={{ opacity: 0.7 }}
            >
              NUTRITION
            </button>
            <button
              type="button"
              onClick={() => applyHeaderFilter("workouts")}
              style={{ opacity: 0.7 }}
            >
              WORKOUTS
            </button>
            <button
              type="button"
              onClick={() => applyHeaderFilter("all", "Recovery")}
              style={{ opacity: 0.7 }}
            >
              RECOVERY
            </button>
          </nav>

          <div className="right-nav">
            {searchOpen && (
              <form className="nav-search" onSubmit={submitSearch}>
                <label className="sr-only" htmlFor="longr-search">
                  Search LONGR
                </label>
                <input
                  ref={searchInputRef}
                  id="longr-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                />
              </form>
            )}
            <button
              className="icon-button search-icon"
              type="button"
              aria-label={searchOpen ? "Close search" : "Search LONGR"}
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((open) => !open);
                setProfileOpen(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <div className="profile-wrap">
              <button
                className="profile-icon"
                type="button"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                onClick={() => {
                  setProfileOpen((open) => !open);
                  setSearchOpen(false);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              {profileOpen && (
                <div className="profile-menu">
                  <strong>{user?.email ?? "LONGR Guest"}</strong>
                  <span>{savedArticles.size} saved articles</span>
                  <small>{isFree ? "Free plan" : "Full feed unlocked"}</small>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title">Choose to Live Longer.</h1>

          <HeroSubtitle />
          {articles.length > 0 && (
            <div className="buttons">
              <button
                className="play-btn"
                type="button"
                onClick={() => openArticle(articles[0])}
              >
                READ ARTICLE
              </button>
              <button
                className="more-info-btn"
                type="button"
                aria-label="More information about today's pick"
                onClick={() => openArticle(articles[0])}
              >
                +
              </button>
            </div>
          )}
          <div className="meta-info">
            <span className="match">Today&apos;s Pick</span>
            <span className="year">2026</span>
          </div>
        </section>

        <section
          className="header-content-section"
          aria-labelledby="featured-heading"
        >
          <h2 id="featured-heading">FEATURED ARTICLES</h2>
          <div className="movie-row">
            {featuredArticles.map((article, index) => (
              <button
                className="movie-card"
                type="button"
                key={article.id}
                onClick={() => openArticle(article)}
                aria-label={`Open ${article.headline}`}
              >
                <span className="tag">{index < 2 ? "Live" : "New"}</span>
                <img src={article.image} alt="" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="categories-wrapper" aria-label="Article categories">
        <div className="categories" ref={categoriesRef}>
          {categories.map((category) => (
            <button
              className={`category-btn${activeCategory === category ? " active" : ""}`}
              type="button"
              key={category}
              onClick={() => selectCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <button
          className="categories-next"
          type="button"
          aria-label="Show more categories"
          onClick={scrollCategories}
        >
          &rsaquo;
        </button>
      </section>

      <section
        className="content-section"
        id="daily-feed"
        aria-labelledby="feed-heading"
      >
        <h2 id="feed-heading">DAILY LONGEVITY FEED</h2>
        {isFree && (
          <div className="free-banner">
            <div className="free-banner-copy">
              <strong>You&apos;re on the LONGR free plan</strong>
              <span>
                You&apos;re seeing the first {FREE_LIMIT} articles free. Unlock
                the full daily feed for $24.99/mo.
              </span>
            </div>
            <button
              className="free-banner-btn"
              type="button"
              onClick={() => setUpgradeOpen(true)}
            >
              Upgrade
            </button>
          </div>
        )}
        {visibleArticles.length > 0 ? (
          <div className="app-grid">
            {visibleArticles.map((article) => (
              <button
                className={`app-card${isLocked(article) ? " locked" : ""}`}
                type="button"
                key={article.id}
                onClick={() => openArticle(article)}
              >
                <span className={`badge ${article.badge}`}>
                  {article.badge}
                </span>
                {isLocked(article) && (
                  <span className="app-card-lock" aria-hidden="true">
                    🔒
                  </span>
                )}
                <img className="cover" src={article.image} alt="" />
                <span className="info">
                  <span className="card-title">{article.headline}</span>
                  <span className="category">{article.category}</span>
                  <span className="price">
                    {isLocked(article)
                      ? "Unlock with LONGR+"
                      : `${article.readTime} · ${article.actionList.length} practical steps`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-feed">
            {articles.length === 0
              ? "No articles available right now."
              : `No articles match “${query}”.`}
          </p>
        )}
      </section>

      {selectedArticle && (
        <section
          className="article-view open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-title"
        >
          <div className="article-shell">
            <aside className="article-sidebar">
              <button
                className="article-back"
                type="button"
                onClick={closeArticleView}
              >
                &larr; Back to Feed
              </button>
              <div className="sidebar-cat-list">
                {categories.slice(1).map((category) => (
                  <button
                    className={`sidebar-cat-btn${
                      (articleCategory ?? selectedArticle.category) === category
                        ? " active"
                        : ""
                    }`}
                    type="button"
                    key={category}
                    onClick={() => browseArticleCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </aside>

            <article
              className={`article-main${articleCategory ? " category-mode" : ""}`}
            >
              {articleCategory ? (
                <>
                  <div className="article-eyebrow">Browse category</div>
                  <h1 className="article-title" id="article-title">
                    {articleCategory}
                  </h1>
                  <div className="article-meta">
                    {categoryArticles.length} recent{" "}
                    {categoryArticles.length === 1 ? "article" : "articles"}
                  </div>
                  <p className="category-results-intro">
                    Choose an article to open its complete LONGR details.
                  </p>
                  <div className="article-category-grid">
                    {categoryArticles.map((article) => (
                      <button
                        className="article-category-card"
                        type="button"
                        key={article.id}
                        onClick={() => openArticle(article)}
                      >
                        <span className="article-category-image-wrap">
                          <img src={article.image} alt="" />
                          <span className={`badge ${article.badge}`}>
                            {article.badge}
                          </span>
                        </span>
                        <span className="article-category-card-copy">
                          <span className="article-category-card-title">
                            {article.headline}
                          </span>
                          <span className="article-category-card-desc">
                            {article.subheadline}
                          </span>
                          <span className="article-category-card-meta">
                            {article.readTime} · {article.actionList.length}{" "}
                            practical steps
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="article-eyebrow">
                    {selectedArticle.category} · {selectedArticle.readTime}
                  </div>
                  <h1 className="article-title" id="article-title">
                    {selectedArticle.headline}
                  </h1>
                  <div className="article-meta">
                    LONGR Editorial · {selectedArticle.category} ·{" "}
                    {selectedArticle.readTime}
                  </div>
                  <div
                    className="article-hero-img"
                    style={{
                      backgroundImage: `url('${selectedArticle.image}')`,
                    }}
                    role="img"
                    aria-label={selectedArticle.headline}
                  />
                  <p className="article-desc article-summary">
                    {selectedArticle.subheadline}
                  </p>

                  <section className="hvco-section">
                    <span className="hvco-section-number">01</span>
                    <h2>The Health Stakes</h2>
                    <p>{selectedArticle.healthStakes}</p>
                  </section>

                  <section className="hvco-section">
                    <span className="hvco-section-number">02</span>
                    <h2>The Longr Action List</h2>
                    <div className="longr-action-list">
                      {selectedArticle.actionList.map((item, index) => (
                        <div className="longr-action" key={`${item.title}-${index}`}>
                          <div className="longr-action-head">
                            <span className="longr-action-number">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3>{item.title}</h3>
                          </div>
                          <dl className="longr-action-fields">
                            <div className="longr-action-field">
                              <dt>Why Longr cares</dt>
                              <dd>{item.whyLongrCares}</dd>
                            </div>
                            <div className="longr-action-field">
                              <dt>What to choose instead</dt>
                              <dd>{item.whatToChooseInstead}</dd>
                            </div>
                            <div className="longr-action-field">
                              <dt>Prepare it this way</dt>
                              <dd>{item.prepareItThisWay}</dd>
                            </div>
                            <div className="longr-action-field">
                              <dt>The simple swap</dt>
                              <dd>
                                <span className="swap-row">
                                  <strong>Instead of:</strong> {item.insteadOf}
                                </span>
                                <span className="swap-row">
                                  <strong>Try:</strong> {item.tryThis}
                                </span>
                              </dd>
                            </div>
                            <div className="longr-action-field">
                              <dt>Longr Tip</dt>
                              <dd>{item.longrTip}</dd>
                            </div>
                            <div className="longr-action-field">
                              <dt>Why your future self cares</dt>
                              <dd>{item.whyFutureSelfCares}</dd>
                            </div>
                          </dl>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="hvco-section hvco-win-section">
                    <span className="hvco-section-number">03</span>
                    <h2>{selectedArticle.ctaHeading}</h2>
                    <div className="hvco-win-callout">
                      <span aria-hidden="true">✓</span>
                      <p>{selectedArticle.ctaBody}</p>
                    </div>
                    <button
                      className="booking-btn cta-button"
                      type="button"
                      onClick={() => setUpgradeOpen(true)}
                    >
                      {selectedArticle.ctaButton}
                    </button>
                  </section>

                  <section className="hvco-section hvco-preview-section">
                    <span className="hvco-section-number">04</span>
                    <h2>Related Longr Articles</h2>
                    <ul className="longr-related">
                      {selectedArticle.relatedIdeas.map((idea) => (
                        <li key={idea}>{idea}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="hvco-section">
                    <span className="hvco-section-number">05</span>
                    <h2>Sources</h2>
                    <ul className="longr-sources">
                      {selectedArticle.sources.map((source) => (
                        <li key={source}>{source}</li>
                      ))}
                    </ul>
                  </section>

                  <button
                    className="booking-btn"
                    type="button"
                    onClick={saveSelectedArticle}
                  >
                    {selectedIsSaved ? "Saved ✓" : "Save Article"}
                  </button>
                </>
              )}
            </article>

            <aside className="article-related">
              <div className="share-panel">
                <div className="share-heading">Share to</div>
                <div className="share-options" aria-label="Share options">
                  <button
                    type="button"
                    onClick={() => void shareArticle("linkedin")}
                    aria-label="Share on LinkedIn"
                    title="LinkedIn"
                  >
                    <FaLinkedinIn aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareArticle("whatsapp")}
                    aria-label="Share on WhatsApp"
                    title="WhatsApp"
                  >
                    <FaWhatsapp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareArticle("x")}
                    aria-label="Share on X"
                    title="X"
                  >
                    <FaXTwitter aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareArticle("facebook")}
                    aria-label="Share on Facebook"
                    title="Facebook"
                  >
                    <FaFacebookF aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareArticle("email")}
                    aria-label="Share by email"
                    title="Email"
                  >
                    <MdEmail aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareArticle("copy")}
                    aria-label="Copy article link"
                    title="Copy link"
                  >
                    <MdContentCopy aria-hidden="true" />
                  </button>
                </div>
                <div className="share-feedback" aria-live="polite">
                  {shareFeedback}
                </div>
              </div>
              <div className="related-list">
                <div className="related-heading">
                  {articleCategory ? "Latest Articles" : "Related Articles"}
                </div>
                {relatedArticles.map((article) => (
                  <button
                    className="related-item"
                    type="button"
                    key={article.id}
                    onClick={() => openArticle(article)}
                  >
                    <img src={article.image} alt="" />
                    <span>
                      <span className="rt">{article.headline}</span>
                      <span className="rc">{article.category}</span>
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        </section>
      )}

      {promoOpen && (
        <div
          className="promo-overlay open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-title"
          onClick={dismissPromo}
        >
          <div className="promo-card">
            <button
              className="promo-close"
              type="button"
              onClick={() => setPromoOpen(false)}
              aria-label="Close nutrition tip"
            >
              &times;
            </button>
            <div className="promo-image" />
            <div className="promo-content">
              <h2 className="promo-title" id="promo-title">
                Don&apos;t Let Your Plate Cut Your Life Short!
              </h2>
              <p className="promo-text">
                Swap one processed snack today for a handful of walnuts or
                berries.
              </p>
              <p className="promo-sub">
                Small trades like this compound over decades 🥜
              </p>
              <button
                className="promo-primary"
                type="button"
                onClick={() => {
                  setPromoOpen(false);
                  applyHeaderFilter("all", "Nutrition");
                }}
              >
                I&apos;m In, Let&apos;s Eat Smart!
              </button>
              <button
                className="promo-secondary"
                type="button"
                onClick={() => setPromoOpen(false)}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {upgradeOpen && (
        <Paywall
          variant="modal"
          userEmail={user?.email}
          userName={user?.displayName}
          onClose={() => setUpgradeOpen(false)}
          onSkip={() => setUpgradeOpen(false)}
          onPaid={() => setUpgradeOpen(false)}
        />
      )}

      <footer className="hub-footer">
        <div className="hub-footer-email">
          Signed in as <strong>{user?.email}</strong>
        </div>
        <button className="logout-btn" type="button" onClick={() => void handleLogout()}>
          Log out
        </button>
      </footer>
    </main>
  );
}
