import diagnosisData from "./data/diagnosisData.js";

const memberPhotos = {
  "大谷映美里": "./assets/members/otani-emiri.jpg",
  "大場花菜": "./assets/members/oba-hana.jpg",
  "音嶋莉沙": "./assets/members/otoshima-risa.jpg",
  "齋藤樹愛羅": "./assets/members/saito-kiara.jpg",
  "佐々木舞香": "./assets/members/sasaki-maika.jpg",
  "髙松瞳": "./assets/members/takamatsu-hitomi.jpg",
  "瀧脇笙古": "./assets/members/takiwaki-shoko.jpg",
  "野口衣織": "./assets/members/noguchi-iori.jpg",
  "諸橋沙夏": "./assets/members/morohashi-sana.jpg",
  "山本杏奈": "./assets/members/yamamoto-anna.jpg",
};

const app = document.querySelector("#app");
const state = {
  step: "intro",
  currentIndex: 0,
  answers: {},
};

function getPhotoSrc(member) {
  return memberPhotos[member];
}

function renderMemberPhoto(member, className = "member-photo") {
  const src = getPhotoSrc(member);
  const initials = member.slice(0, 2);
  return `
    <div class="${className}" aria-label="${member}の写真枠">
      <img src="${src}" alt="${member}" onerror="this.remove(); this.parentElement.dataset.empty='true';" />
      <span>${initials}</span>
    </div>
  `;
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

function getProgressText() {
  return `${Object.keys(state.answers).length}/${diagnosisData.questions.length}`;
}

function setAnswer(questionId, optionId) {
  state.answers[questionId] = optionId;
  const isLast = state.currentIndex === diagnosisData.questions.length - 1;
  state.currentIndex = isLast ? state.currentIndex : state.currentIndex + 1;
  render();
}

function showResult() {
  if (Object.keys(state.answers).length !== diagnosisData.questions.length) return;
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
  const text = diagnosisData.meta.shareTextTemplate.replace("{member}", member);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function renderIntro() {
  app.innerHTML = `
    <section class="intro-view">
      <div class="hero-panel">
        <p class="eyebrow">Fan personality quiz</p>
        <h1>${diagnosisData.meta.title}</h1>
        <p class="subtitle">${diagnosisData.meta.subtitle}</p>
        <div class="member-strip" aria-hidden="true">
          ${diagnosisData.members.map((member) => renderMemberPhoto(member, "mini-photo")).join("")}
        </div>
        <button class="primary-action" type="button" data-action="start">診断をはじめる</button>
      </div>
      <p class="disclaimer">${diagnosisData.meta.disclaimer}</p>
    </section>
  `;
}

function renderQuestion() {
  const question = diagnosisData.questions[state.currentIndex];
  const selected = state.answers[question.id];
  const canShowResult = Object.keys(state.answers).length === diagnosisData.questions.length;
  const progress = Math.round((Object.keys(state.answers).length / diagnosisData.questions.length) * 100);

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
        <button class="secondary-action" type="button" data-action="next" ${state.currentIndex === diagnosisData.questions.length - 1 ? "disabled" : ""}>次へ</button>
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

  app.innerHTML = `
    <section class="result-view">
      <article class="result-hero">
        ${renderMemberPhoto(member, "result-photo")}
        <p class="eyebrow">Your type is</p>
        <h1>${member}タイプ</h1>
        <h2>${result.title}</h2>
      </article>
      <section class="result-body">
        <div class="text-block">
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
      <p class="photo-note">メンバー画像は <code>assets/members/</code> から表示しています。</p>
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
  if (action === "next") {
    state.currentIndex = Math.min(diagnosisData.questions.length - 1, state.currentIndex + 1);
    render();
  }
  if (action === "result") showResult();
  if (action === "share-x") shareOnX(pickResultMember(calculateScores()));
  if (action === "restart") resetDiagnosis();
});

render();
