"use client";
import { useState } from "react";

const QUESTIONS = [
  {
    id: "location",
    text: "Where are you right now?",
    type: "single",
    options: [
      { label: "🏠 At home", value: "home" },
      { label: "💼 At work", value: "work" },
      { label: "🌍 Out in the world", value: "out" },
      { label: "🚗 In transit", value: "transit" },
    ],
  },
  {
    id: "somatic",
    text: "Quick body scan. What's true right now?",
    type: "multi",
    hint: "Select all that apply",
    options: [
      { label: "🫁 Holding my breath / chest tight", value: "breath" },
      { label: "🍽️ Haven't eaten (or barely)", value: "hungry" },
      { label: "💧 Can't remember my last water", value: "dehydrated" },
      { label: "🥵 Physically uncomfortable (too hot, too cold, need to pee, etc.)", value: "discomfort" },
      { label: "😶 Can't feel much of anything", value: "numb" },
      { label: "😬 Jaw, shoulders, or fists clenched", value: "tension" },
    ],
  },
  {
    id: "loudest",
    text: "What's the loudest thing right now?",
    type: "single",
    options: [
      { label: "🧒 Someone needs my attention", value: "someone_needs_me" },
      { label: "🏠 The house / environment", value: "environment" },
      { label: "💸 Money stress", value: "money" },
      { label: "😵 Everything at once", value: "everything" },
    ],
  },
  {
    id: "dependents",
    text: "Is anyone counting on you in this moment?",
    type: "single",
    options: [
      { label: "👀 Yes and they need me now", value: "dependents_needy" },
      { label: "🎮 Yes but they're occupied", value: "dependents_occupied" },
      { label: "🙏 No, I have a moment", value: "no_dependents" },
    ],
  },
];

export default function Home() {
  const [step, setStep] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelections, setMultiSelections] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const currentQuestion = QUESTIONS[currentQ];

  const toggleMulti = (value) => {
    setMultiSelections((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSingleAnswer = async (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    await advanceQuestion(newAnswers);
  };

  const handleMultiAnswer = async () => {
    const newAnswers = { ...answers, [currentQuestion.id]: multiSelections.length > 0 ? multiSelections : ["none"] };
    setAnswers(newAnswers);
    setMultiSelections([]);
    await advanceQuestion(newAnswers);
  };

  const advanceQuestion = async (newAnswers) => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setStep("loading");
      await getAdvice(newAnswers);
    }
  };

  const getAdvice = async (finalAnswers) => {
    const somaticList = finalAnswers.somatic?.includes("none")
      ? "No somatic signals flagged"
      : `Physical signals: ${finalAnswers.somatic?.join(", ")}`;

    const userMessage = `
Location: ${finalAnswers.location}
${somaticList}
Loudest stressor: ${finalAnswers.loudest}
Dependents situation: ${finalAnswers.dependents}
Tell me the one thing to do right now.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(JSON.stringify(errData));
      }

      const data = await response.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStep("result");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStep("result");
    }
  };

  const reset = () => {
    setStep("intro");
    setCurrentQ(0);
    setAnswers({});
    setMultiSelections([]);
    setResult(null);
    setError(null);
  };

  const totalSteps = QUESTIONS.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F0E8; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes bounce {
          0% { transform: translateY(0); opacity: 0.4; }
          100% { transform: translateY(-7px); opacity: 1; }
        }
        .opt-btn:hover {
          background: rgba(74,85,65,0.1) !important;
          border-color: #7A8C6E !important;
          color: #3C3228 !important;
        }
        .main-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(60,50,40,0.25) !important;
        }
      `}</style>
      <div style={styles.root}>
        <div style={styles.texture} />
        <div style={{position:"fixed", top:"-5%", right:"-5%", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle, rgba(122,140,110,0.12) 0%, transparent 70%)", pointerEvents:"none", zIndex:0}} />
        <div style={{position:"fixed", bottom:"-10%", left:"-8%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(210,195,170,0.2) 0%, transparent 70%)", pointerEvents:"none", zIndex:0}} />

        {step === "intro" && (
          <div style={styles.card}>
            <div style={styles.tag}>for the one holding it all together</div>
            <h1 style={styles.title}>just tell me<br />what to do</h1>
            <p style={styles.subtitle}>4 quick questions. One answer.<br />No lists, no lectures, no fluff.</p>
            <button className="main-btn" style={styles.btn} onClick={() => setStep("questions")}>
              I need help right now
            </button>
          </div>
        )}

        {step === "questions" && (
          <div style={styles.card}>
            <div style={styles.progressRow}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} style={{...styles.pip, background: i <= currentQ ? "#4A5541" : "rgba(60,50,40,0.15)"}} />
              ))}
            </div>
            <p style={styles.questionText}>{currentQuestion.text}</p>
            {currentQuestion.hint && <p style={styles.multiHint}>{currentQuestion.hint}</p>}
            <div style={styles.optionGrid}>
              {currentQuestion.options.map((opt) => {
                const selected = multiSelections.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    className="opt-btn"
                    style={{
                      ...styles.optionBtn,
                      ...(currentQuestion.type === "multi" && selected ? {
                        background: "rgba(74,85,65,0.12)",
                        borderColor: "#7A8C6E",
                        color: "#3C3228",
                      } : {})
                    }}
                    onClick={() => currentQuestion.type === "multi"
                      ? toggleMulti(opt.value)
                      : handleSingleAnswer(currentQuestion.id, opt.value)
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {currentQuestion.type === "multi" && (
              <button className="main-btn" style={styles.btn} onClick={handleMultiAnswer}>
                {multiSelections.length === 0 ? "None of these → Next" : `Got it (${multiSelections.length}) → Next`}
              </button>
            )}
          </div>
        )}

        {step === "loading" && (
          <div style={styles.card}>
            <div style={styles.loadingRow}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <div key={i} style={{width: 9, height: 9, borderRadius: "50%", background: i === 1 ? "#7A8C6E" : "#3C3228", animation: `bounce 0.7s ${delay}s infinite alternate`}} />
              ))}
            </div>
            <p style={styles.loadingText}>Figuring it out for you...</p>
          </div>
        )}

        {step === "result" && (
          <div style={styles.card}>
            {error ? (
              <p style={{color: "#7A3A2A", fontSize: "1rem", fontFamily: "'DM Sans', sans-serif"}}>{error}</p>
            ) : (
              <>
                <div style={{fontSize: "3.5rem", lineHeight: 1, animation: "float 3s ease-in-out infinite"}}>{result?.emoji}</div>
                <div style={styles.resultDivider} />
                <p style={styles.resultAction}>{result?.action}</p>
                {result?.why && <p style={styles.resultWhy}>{result.why}</p>}
              </>
            )}
            <button className="main-btn" style={{...styles.btn, marginTop: "1rem"}} onClick={reset}>
              I need another one
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  root: { minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative", overflow: "hidden" },
  texture: { position: "fixed", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 0 },
  card: { position: "relative", zIndex: 1, maxWidth: 460, width: "100%", background: "rgba(255,252,245,0.85)", border: "1px solid rgba(60,50,40,0.08)", borderRadius: 28, padding: "3rem 2.4rem", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", textAlign: "center", boxShadow: "0 4px 40px rgba(60,50,40,0.1), 0 1px 0 rgba(255,255,255,0.9) inset" },
  tag: { fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(100,90,78,0.5)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 },
  title: { fontSize: "clamp(2rem, 7vw, 4rem)", fontWeight: 800, color: "#6B7A5E", lineHeight: 1.1, margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em", textTransform: "lowercase", transform: "scaleX(0.82)", display: "block" },
  subtitle: { fontSize: "0.92rem", color: "rgba(100,90,78,0.6)", lineHeight: 1.75, margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 },
  btn: { background: "linear-gradient(135deg, #3C3228 0%, #2C2418 100%)", color: "#F5EDD8", border: "none", borderRadius: 14, padding: "1rem 2rem", fontSize: "0.92rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em", width: "100%", boxShadow: "0 4px 20px rgba(60,50,40,0.2)", transition: "transform 0.15s, box-shadow 0.15s" },
  progressRow: { display: "flex", gap: 8, alignSelf: "flex-start" },
  pip: { width: 28, height: 3, borderRadius: 99, transition: "background 0.3s" },
  questionText: { fontSize: "1.4rem", color: "#3C3228", fontWeight: 700, margin: 0, lineHeight: 1.4, fontFamily: "'Syne', sans-serif" },
  multiHint: { fontSize: "0.62rem", color: "rgba(100,90,78,0.4)", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0, fontFamily: "'DM Sans', sans-serif" },
  optionGrid: { display: "flex", flexDirection: "column", gap: 9, width: "100%" },
  optionBtn: { background: "rgba(60,50,40,0.04)", border: "1px solid rgba(60,50,40,0.12)", borderRadius: 12, padding: "0.85rem 1.2rem", color: "#7A6E62", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 400, cursor: "pointer", textAlign: "left", transition: "all 0.15s", lineHeight: 1.4 },
  loadingRow: { display: "flex", gap: 8, alignItems: "center", justifyContent: "center", height: 40 },
  loadingText: { color: "rgba(100,90,78,0.45)", fontSize: "0.88rem", margin: 0, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" },
  resultDivider: { width: 48, height: 2, background: "linear-gradient(90deg, #3C3228, #7A8C6E)", borderRadius: 99 },
  resultAction: { fontSize: "1.5rem", fontWeight: 700, color: "#3C3228", lineHeight: 1.45, margin: 0, fontFamily: "'Syne', sans-serif" },
  resultWhy: { fontSize: "0.85rem", color: "rgba(100,90,78,0.6)", lineHeight: 1.75, margin: 0, fontFamily: "'DM Sans', sans-serif" },
};