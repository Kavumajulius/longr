"use client";

/* eslint-disable @next/next/no-img-element -- transparent decorative cutouts need predictable intrinsic-free positioning */

import type { OnboardingAnswers, QuizStepDefinition } from "./onboarding-data";
import { quizSteps } from "./onboarding-data";
import { ChevronRight } from "lucide-react";

const DEDICATED_CHOICE_ICONS: Record<string, string> = {
  "nutrition_overwhelm_level:sometimes": "/images/onboarding/icon-sometimes.png",
  "current_eating_approach:inconsistent": "/images/onboarding/icon-inconsistent-eating.png",
  "current_context:stay_ahead": "/images/onboarding/icon-stay-ahead.png",
  "previous_food_learning_method:professional": "/images/onboarding/icon-doctor-dietitian.png",
  "first_week_win:swaps": "/images/onboarding/icon-grocery-swaps.png",
  "daily_time_commitment:3_min": "/images/onboarding/icon-three-minutes.png",
};

interface QuizStepsProps {
  step: QuizStepDefinition;
  stepNumber: number;
  answers: OnboardingAnswers;
  onAnswer: (value: string) => void;
  onSkip?: () => void;
}

export default function QuizSteps({ step, stepNumber, answers, onAnswer, onSkip }: QuizStepsProps) {
  const featureImage = stepNumber === 1
    ? { src: "/images/onboarding/quiz-woman-50.png", alt: "A confident woman encouraging the reader to begin" }
    : stepNumber === 15
      ? { src: "/images/onboarding/quiz-man-55.png", alt: "A confident man encouraging a realistic daily commitment" }
      : null;

  return (
    <section className={`screen active quiz-screen${featureImage ? " quiz-screen-with-person" : ""}${stepNumber === 15 ? " quiz-screen-with-person--commitment" : ""}`} aria-labelledby="quiz-title">
      <div className="quiz-question-content">
        {step.progressNote && <div className="quiz-momentum">{step.progressNote}</div>}
        <p className="quiz-kicker">Eat for the years ahead.</p>
        <h1 className="step-title" id="quiz-title">{step.title}</h1>
        {step.supporting && <p className="step-sub">{step.supporting}</p>}
        <div className="quiz-choice-list" role="group" aria-label={step.title}>
          {step.choices.map((item, index) => {
            const absoluteIconIndex = quizSteps.slice(0, stepNumber - 1).reduce((total, quizStep) => total + quizStep.choices.length, 0) + index;
            const iconSheet = Math.floor(absoluteIconIndex / 16) + 1;
            const iconCell = absoluteIconIndex % 16;
            const iconColumn = iconCell % 4;
            const iconRow = Math.floor(iconCell / 4);
            const dedicatedIcon = DEDICATED_CHOICE_ICONS[`${step.key}:${item.value}`];
            return (
              <button className={`quiz-choice${answers[step.key] === item.value ? " selected" : ""}`} type="button" key={item.value} onClick={() => onAnswer(item.value)}>
                <span
                  className="quiz-choice-icon"
                  style={{
                    backgroundImage: `url('${dedicatedIcon ?? `/images/onboarding/choice-icons-3d-${iconSheet}${iconSheet >= 2 && iconSheet <= 4 ? "-clean" : ""}.png`}')`,
                    backgroundPosition: dedicatedIcon ? "center" : `${iconColumn * 33.333}% ${iconRow * 33.333}%`,
                    backgroundSize: dedicatedIcon ? "contain" : "400% 400%",
                  }}
                  aria-hidden="true"
                />
                <span className="quiz-choice-label">{item.label}</span>
                <ChevronRight className="quiz-choice-arrow" size={20} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        {step.optional && <button className="quiz-skip" type="button" onClick={onSkip}>Prefer not to say</button>}
        <p className="quiz-safety-note">Question {stepNumber} is used for content personalization, not medical assessment.</p>
      </div>
      {featureImage && <div className="quiz-person" aria-hidden="true"><img src={featureImage.src} alt="" /></div>}
    </section>
  );
}
