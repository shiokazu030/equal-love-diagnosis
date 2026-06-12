import diagnosisData from "./data/diagnosisData.js";

const memberCards = {
  "大谷映美里": {
    image: "./assets/cards/optimized/otani-emiri-card.jpg",
    theme: "#b793df",
    charm: "Lavender jewel",
  },
  "大場花菜": {
    image: "./assets/cards/optimized/oba-hana-card.jpg",
    theme: "#f17b2d",
    charm: "Orange ribbon",
  },
  "音嶋莉沙": {
    image: "./assets/cards/optimized/otoshima-risa-card.jpg",
    theme: "#9fd7ee",
    charm: "Aqua lace",
  },
  "齋藤樹愛羅": {
    image: "./assets/cards/optimized/saito-kiara-card.jpg",
    theme: "#f58db8",
    charm: "Pink heart",
  },
  "佐々木舞香": {
    image: "./assets/cards/optimized/sasaki-maika-card.jpg",
    theme: "#caa9e8",
    charm: "Lilac bloom",
  },
  "髙松瞳": {
    image: "./assets/cards/optimized/takamatsu-hitomi-card.jpg",
    theme: "#e55f71",
    charm: "Rose sparkle",
  },
  "瀧脇笙古": {
    image: "./assets/cards/optimized/takiwaki-shoko-card.jpg",
    theme: "#f3c94d",
    charm: "Golden star",
  },
  "野口衣織": {
    image: "./assets/cards/optimized/noguchi-iori-card.jpg",
    theme: "#9a68d1",
    charm: "Violet prism",
  },
  "諸橋沙夏": {
    image: "./assets/cards/optimized/morohashi-sana-card.jpg",
    theme: "#95c887",
    charm: "Mint clover",
  },
  "山本杏奈": {
    image: "./assets/cards/optimized/yamamoto-anna-card.jpg",
    theme: "#4e8fe8",
    charm: "Blue crystal",
  },
};

const app = document.querySelector("#app");
const state = {
  step: "intro",
  currentIndex: 0,
  answers: {},
};

function cardFor(member) {
  return memberCards[member] || {
    image: "./assets/cards/optimized/love-heart.jpg",
    theme: "#f26f9d",
    charm: "Equal love",
  };
}

function getEmptyMemberScores() {
  return Object.fromEntries(diagnosisData.members.map((member) => [member, 0]));
}

function getEmptyCategoryScores() {
  return Object.fromEntries(Object.keys(diagnosisData.categories).map((category) => [category, 0]));
}

function calculateScores() {
  const memberScores = getEmptyMemberScores();
  const lateScores = getEmptyMemberScores();
  const categoryScores = getEmptyCategoryScores();

  diagnosisData.questions.forEach((question, index) => {
    const selectedId = state.answers[question.id];
    const option = question.options.find((item) => item.id === selectedId);
    if (!option) return;

    categoryScores[option.category] += 1;
    Object.entries(option.scores).forEach(([member, points]) => {
      memberScores[member] += points;
      if (index >= 15) lateScores[member] += points;
    });
  });

  return { memberScores, categoryScores, lateScores };
}

function getMemberCategoryScore(member, categoryScores) {
  const categories = diagnosisData.tieBreaker.memberCategories[member] || [];
  return Math.max(...categories.map((category) => categoryScores[category] || 0), 0);
}

function pickResultMember(scores) {
  const { memberScores, categoryScores, lateScores } = scores;
  const highest = Math.max(...Object.values(memberScores));
  let candidates = diagnosisData.members.filter((member) => memberScores[member] === highest);

  if (candidates.length > 1) {
    const bestCategoryScore = Math.max(...candidates.map((member) => getMemberCategoryScore(member, categoryScores)));
    candidates = candidates.filter((member) => getMemberCategoryScore(member, categoryScores) === bestCategoryScore);
  }

  if (candidates.length > 1) {
    const bestLateScore = Math.max(...candidates.map((member) => lateScores[member]));
    candidates = candidates.filter((member) => lateScores[member] === bestLateScore);
  }

  if (candidates.length > 1) {
    return diagnosisData.tieBreaker.fallbackPriority.find((member) => candidates.includes(member));
  }

  return candidates[0];
}

function answeredCount() {
  return Object.keys(state.answers).length;
}

function getProgressText() {
  return `${answeredCount()}/${diagnosisData.questions.length}`;
}

function setAnswer(questionId, optionId) {
  state.answers[questionId] = optionId;
  const isLast = state.currentIndex === diagnosisData.questions.length - 1;
  state.currentIndex = isLast ? state.currentIndex : state.currentIndex + 1;
  render();
}

function showResult() {
  if (answeredCount() !== diagnosisData.questions.length) return;
  state.step = "result";
  render();
}

function resetDiagnosis() {
  state.step = "intro";
  state.currentIndex = 0;
  state.answers = {};
  render();
}

function shareOnX(member) {
  const pageUrl = window.location.href;
  const text = `${diagnosisData.meta.shareTextTemplate.replace("{member}", member)}\n\n${pageUrl}`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function renderCardStack() {
  const featured = ["齋藤樹愛羅", "大谷映美里", "山本杏奈", "諸橋沙夏", "髙松瞳"];
  return featured
    .map((member, index) => {
      const card = cardFor(member);
      return `
        <figure class="hero-card hero-card-${index + 1}" style="--card-color: ${card.theme}">
          <img src="${card.image}" alt="" loading="${index === 1 ? "eager" : "lazy"}" />
        </figure>
      `;
    })
    .join("");
}

function renderMemberChips() {
  return diagnosisData.members
    .map((member) => {
      const card = cardFor(member);
      return `<span class="member-chip" style="--chip-color: ${card.theme}">${member}</span>`;
    })
    .join("");
}

function renderIntro() {
  app.innerHTML = `
    <section class="intro-view">
      <div class="sparkle-field" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <section class="hero-stage">
        <div class="hero-copy">
          <p class="eyebrow">Unofficial fan quiz</p>
          <h1 class="hero-title"><span>イコラブ</span><span>性格タイプ</span><span>診断</span></h1>
          <p class="subtitle">${diagnosisData.meta.subtitle}</p>
          <div class="hero-actions">
            <button class="primary-action" type="button" data-action="start">診断をはじめる</button>
          </div>
          <p class="micro-copy">20問であなたのタイプを判定</p>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <img class="love-mark" src="./assets/cards/optimized/love-heart.jpg" alt="" />
          <div class="card-stack">${renderCardStack()}</div>
        </div>
      </section>
      <section class="member-ribbon" aria-label="診断結果メンバー一覧">
        ${renderMemberChips()}
      </section>
      <p class="disclaimer">${diagnosisData.meta.disclaimer}</p>
    </section>
  `;
}

function renderQuestion() {
  const question = diagnosisData.questions[state.currentIndex];
  const selected = state.answers[question.id];
  const canShowResult = answeredCount() === diagnosisData.questions.length;
  const progress = Math.round((answeredCount() / diagnosisData.questions.length) * 100);

  app.innerHTML = `
    <section class="quiz-view">
      <header class="quiz-header">
        <button class="ghost-action" type="button" data-action="intro">最初へ</button>
        <div class="progress-copy">
          <span>回答 ${getProgressText()}</span>
          <strong>Q${state.currentIndex + 1}</strong>
        </div>
      </header>
      <div class="progress-track" aria-hidden="true"><span style="width: ${progress}%"></span></div>
      <article class="question-card">
        <p class="question-count">Question ${state.currentIndex + 1}</p>
        <h2>${question.text}</h2>
        <div class="options-list">
          ${question.options
            .map(
              (option) => `
                <button class="option-button ${selected === option.id ? "is-selected" : ""}" type="button" data-answer="${option.id}">
                  <span class="option-id">${option.id}</span>
                  <span>${option.text}</span>
                </button>
              `,
            )
            .join("")}
        </div>
      </article>
      <footer class="quiz-controls">
        <button class="secondary-action" type="button" data-action="prev" ${state.currentIndex === 0 ? "disabled" : ""}>戻る</button>
        <button class="primary-action compact" type="button" data-action="result" ${canShowResult ? "" : "disabled"}>結果を見る</button>
      </footer>
      <p class="disclaimer">${diagnosisData.meta.disclaimer}</p>
    </section>
  `;
}

function renderResult() {
  const scores = calculateScores();
  const member = pickResultMember(scores);
  const result = diagnosisData.results[member];
  const card = cardFor(member);

  app.innerHTML = `
    <section class="result-view" style="--result-color: ${card.theme}">
      <article class="result-hero">
        <div class="result-card">
          <img src="${card.image}" alt="${member}タイプのイメージカード" />
        </div>
        <div class="result-copy">
          <p class="eyebrow">Your type is</p>
          <h1><span>${member}</span><span>タイプ</span></h1>
          <h2>${result.title}</h2>
          <p class="result-charm">${card.charm}</p>
        </div>
      </article>
      <section class="result-body">
        <div class="text-block main-block">
          <h3>性格タイプ</h3>
          <p>${result.personality}</p>
        </div>
        <div class="text-block">
          <h3>推し方</h3>
          <p>${result.oshiStyle}</p>
        </div>
        <div class="text-block">
          <h3>周りから見たあなた</h3>
          <p>${result.fromOthers}</p>
        </div>
        <div class="matches">
          <h3>相性のよいタイプ</h3>
          <div class="match-list">
            ${result.matches.map((match) => `<span>${match}</span>`).join("")}
          </div>
        </div>
      </section>
      <section class="share-box">
        <button class="primary-action" type="button" data-action="share-x">Xで共有する</button>
      </section>
      <footer class="result-actions">
        <button class="secondary-action" type="button" data-action="restart">もう一度診断する</button>
      </footer>
      <p class="disclaimer">${diagnosisData.meta.disclaimer}</p>
    </section>
  `;
}

function render() {
  if (state.step === "intro") renderIntro();
  if (state.step === "quiz") renderQuestion();
  if (state.step === "result") renderResult();
}

app.addEventListener("click", (event) => {
  const answer = event.target.closest("[data-answer]");
  const action = event.target.closest("[data-action]")?.dataset.action;

  if (answer) {
    const question = diagnosisData.questions[state.currentIndex];
    setAnswer(question.id, answer.dataset.answer);
    return;
  }

  if (action === "start") {
    state.step = "quiz";
    render();
  }
  if (action === "intro") resetDiagnosis();
  if (action === "prev") {
    state.currentIndex = Math.max(0, state.currentIndex - 1);
    render();
  }
  if (action === "result") showResult();
  if (action === "share-x") shareOnX(pickResultMember(calculateScores()));
  if (action === "restart") resetDiagnosis();
});

render();
