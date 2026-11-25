const categories = [
  {
    id: "cards",
    name: "Карты",
    icon: "К",
    questions: [
      {
        id: "block-card",
        title: "Как заблокировать карту?",
        aliases: ["потерял карту", "украли карту", "заблокировать карточку", "заморозить карту"],
        answer: "Вы можете заблокировать карту в приложении: раздел «Карты» → выберите карту → «Заблокировать». Для срочной блокировки позвоните в банк."
      },
      {
        id: "card-not-arrived",
        title: "Карта ещё не пришла",
        aliases: ["нет пластика", "карта не доставлена", "новая карта не пришла", "ожидаю карту"],
        answer: "Обычно доставка занимает 3–7 рабочих дней. Проверьте статус доставки в приложении. Если срок истёк, оформим повторную выдачу."
      },
      {
        id: "card-limit",
        title: "Изменить лимит по карте",
        aliases: ["предел перевода", "ограничение карты", "увеличить лимит", "уменьшить лимит"],
        answer: "Лимиты перевода можно изменить в разделе «Карты» → «Настройки безопасности» → «Лимиты». Изменения подтверждаются в приложении."
      }
    ]
  },
  {
    id: "transfers",
    name: "Переводы",
    icon: "П",
    questions: [
      {
        id: "money-not-arrived",
        title: "Не пришли деньги",
        aliases: ["перевод не поступил", "средства не пришли", "не произошло зачисление", "не произошел возврат", "не произошёл возврат", "не вернули деньги", "платеж не дошёл", "платёж не дошёл"],
        answer: "Проверьте статус перевода в истории операций. При статусе «В обработке» дождитесь проверки. При статусе «Отклонён» обратитесь к отправителю за номером операции."
      },
      {
        id: "cancel-transfer",
        title: "Отменить перевод",
        aliases: ["отменить платеж", "отменить платёж", "вернуть перевод", "отозвать перевод"],
        answer: "Незавершённый перевод можно отменить в истории операций. Завершённый перевод можно вернуть только по заявлению получателя."
      },
      {
        id: "transfer-limit",
        title: "Лимит на переводы",
        aliases: ["сколько могу перевести", "максимальный перевод", "лимиты переводов"],
        answer: "Лимиты зависят от способа перевода и подтверждения личности. Актуальная сумма отображается перед подтверждением."
      }
    ]
  },
  {
    id: "deposits",
    name: "Вклады",
    icon: "В",
    questions: [
      {
        id: "open-deposit",
        title: "Как открыть вклад?",
        aliases: ["открыть депозит", "начать накопительный счет", "начать накопительный счёт"],
        answer: "Откройте раздел «Вклады» в приложении, выберите срок и условия. Вклад можно открыть со счёта без посещения офиса."
      },
      {
        id: "close-deposit",
        title: "Как закрыть вклад?",
        aliases: ["снять вклад", "закрыть депозит", "забрать накопления"],
        answer: "Закрыть вклад можно в приложении в разделе «Вклады». При досрочном закрытии ставка может пересчитываться."
      }
    ]
  },
  {
    id: "account",
    name: "Счёт и операции",
    icon: "С",
    questions: [
      {
        id: "statement",
        title: "Получить выписку",
        aliases: ["история операций", "справка по счёту", "справка по счету", "скачать выписку"],
        answer: "Выписку можно скачать: «История» → «Выписка» → выберите период и формат PDF или Excel."
      },
      {
        id: "unknown-payment",
        title: "Незнакомое списание",
        aliases: ["не узнаю платёж", "не знаю списание", "неверное списание", "сняли деньги без меня"],
        answer: "Проверьте название и дату операции в истории. Если платёж не узнаёте, заблокируйте карту и оспорьте операцию в разделе «Помощь»."
      }
    ]
  }
];

const chatBody = document.getElementById("chatBody");
const operatorModal = document.getElementById("operatorModal");
const historyModal = document.getElementById("historyModal");
const analyticsModal = document.getElementById("analyticsModal");
const toast = document.getElementById("toast");

const HISTORY_KEY = "bankBotHistory";
const ANALYTICS_KEY = "bankBotAnalytics";
let currentMessages = [];
let currentSessionStarted = new Date().toISOString();
let isAdmin = sessionStorage.getItem("bankBotAdmin") === "true";

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function track(eventName, details = {}) {
  const analytics = readStorage(ANALYTICS_KEY, []);
  analytics.push({ eventName, details, timestamp: new Date().toISOString() });
  writeStorage(ANALYTICS_KEY, analytics.slice(-500));
}

function saveHistorySnapshot(reason) {
  const hasConversation = currentMessages.some((message) => message.role === "user");
  if (!hasConversation) return;

  const history = readStorage(HISTORY_KEY, []);
  history.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    reason,
    startedAt: currentSessionStarted,
    endedAt: new Date().toISOString(),
    messages: currentMessages.slice(-20)
  });
  writeStorage(HISTORY_KEY, history.slice(0, 10));
}

function recordMessage(role, text) {
  currentMessages.push({ role, text, timestamp: new Date().toISOString() });
}

function scrollToEnd() {
  requestAnimationFrame(() => { chatBody.scrollTop = chatBody.scrollHeight; });
}

function addBotMessage(text) {
  recordMessage("bot", text);
  const row = document.createElement("div");
  row.className = "message-row bot-row";
  row.innerHTML = `<div class="bot-avatar" aria-hidden="true">Б</div><div class="message bot-message"><p>${escapeHtml(text)}</p></div>`;
  chatBody.appendChild(row);
  scrollToEnd();
}

function addUserMessage(text) {
  recordMessage("user", text);
  const row = document.createElement("div");
  row.className = "message-row user-row";
  row.innerHTML = `<div class="message user-message"><p>${escapeHtml(text)}</p></div>`;
  chatBody.appendChild(row);
  scrollToEnd();
}

function removeStarter() {
  document.getElementById("starterPanel")?.remove();
  document.querySelectorAll(".options-block").forEach((block) => block.remove());
}

function renderCategoryGrid(container) {
  container.innerHTML = categories.map((category) => `
    <button class="category-button" type="button" data-category="${category.id}">
      <span class="category-icon">${category.icon}</span><span>${category.name}</span>
    </button>
  `).join("");
}

function showCategoryQuestions(categoryId) {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return;
  track("category_selected", { category: category.name });
  removeStarter();
  addUserMessage(category.name);
  addBotMessage(`Выберите вопрос по категории «${category.name}»:`);

  const block = document.createElement("div");
  block.className = "options-block";
  block.innerHTML = `
    <div class="option-grid">${category.questions.map((question) =>
      `<button class="option-button" type="button" data-answer="${question.id}">${question.title}</button>`
    ).join("")}</div>
    ${alternativesMarkup()}
  `;
  chatBody.appendChild(block);
  scrollToEnd();
}

function showAnswer(answerId) {
  const question = categories.flatMap((category) => category.questions).find((item) => item.id === answerId);
  if (!question) return;
  track("answer_selected", { answerId, title: question.title });
  document.querySelectorAll(".options-block").forEach((block) => block.remove());
  addUserMessage(question.title);
  addBotMessage(question.answer);

  const block = document.createElement("div");
  block.className = "options-block";
  block.innerHTML = `
    <p class="section-label">Подошёл ли ответ?</p>
    <div class="action-row">
      <button class="action-button primary-action" type="button" data-action="answer-yes">Да, ответ помог</button>
      <button class="action-button" type="button" data-action="operator">Нет, оператору</button>
      <button class="action-button" type="button" data-action="search-again">Переформулировать</button>
      <button class="back-button" type="button" data-action="categories">К категориям</button>
    </div>`;
  chatBody.appendChild(block);
  scrollToEnd();
}

function searchRequest(query) {
  const normalized = query.trim();
  if (!normalized) {
    showToast("Введите ключевой запрос");
    document.getElementById("searchInput").focus();
    return;
  }

  if (normalized.toLocaleLowerCase("ru-RU") === "admin") {
    enableAdminMode();
    return;
  }

  removeStarter();
  addUserMessage(normalized);
  const allQuestions = categories.flatMap((category) =>
    category.questions.map((question) => ({ ...question, categoryName: category.name }))
  );
  const matches = SearchCore.rankSearchResults(normalized, allQuestions);
  track("search", { query: normalized, matches: matches.length, topResult: matches[0]?.title || null });

  if (matches.length === 0) {
    addBotMessage("По вашему запросу точного совпадения не нашлось.");
    showAlternatives("Попробуйте переформулировать вопрос или выберите другой способ.");
    track("no_results", { query: normalized });
    return;
  }

  addBotMessage(`Нашёл несколько вариантов. Выберите наиболее подходящий:`);
  const block = document.createElement("div");
  block.className = "options-block";
  block.innerHTML = `
    <div class="option-grid">${matches.slice(0, 4).map((question) => `
      <button class="option-button ranked-option" type="button" data-answer="${question.id}">
        <span>${question.title}</span>
        ${isAdmin ? `<small>Релевантность: ${question.relevance}%</small>` : ""}
      </button>
    `).join("")}</div>
    ${alternativesMarkup()}
  `;
  chatBody.appendChild(block);
  scrollToEnd();
}

function alternativesMarkup() {
  return `
    <p class="section-label">Другие способы продолжения</p>
    <div class="action-row">
      <button class="action-button" type="button" data-action="search-again">Изменить запрос</button>
      <button class="action-button" type="button" data-action="categories">Посмотреть категории</button>
      <button class="action-button" type="button" data-action="operator">Связаться с оператором</button>
    </div>`;
}

function showAlternatives(text) {
  addBotMessage(text);
  const block = document.createElement("div");
  block.className = "options-block";
  block.innerHTML = alternativesMarkup();
  chatBody.appendChild(block);
  scrollToEnd();
}

function showCategories() {
  track("categories_opened");
  removeStarter();
  addUserMessage("Посмотреть категории");
  addBotMessage("Выберите подходящую категорию:");
  const block = document.createElement("div");
  block.className = "options-block";
  block.innerHTML = `<div class="category-grid">${categories.map((category) => `
    <button class="category-button" type="button" data-category="${category.id}">
      <span class="category-icon">${category.icon}</span><span>${category.name}</span>
    </button>`).join("")}</div>`;
  chatBody.appendChild(block);
  scrollToEnd();
}

function showSearchAgain() {
  removeStarter();
  addBotMessage("Введите уточнённый запрос. Например: «не произошел возврат».");
  const input = document.getElementById("searchInput");
  input.value = "";
  input.focus();
  scrollToEnd();
}

function openModal(modal) {
  modal.hidden = false;
  modal.querySelector("button, [href]")?.focus();
}

function closeModal(modal) {
  modal.hidden = true;
}

function openOperatorModal() {
  track("operator_modal_opened");
  openModal(operatorModal);
  document.getElementById("confirmOperator").focus();
}

function confirmOperator() {
  closeModal(operatorModal);
  track("operator_confirmed");
  saveHistorySnapshot("Передача оператору");
  removeStarter();
  addBotMessage("В этом MVP переход оператору имитируется. В реальном сервисе диалог передастся оператору с сохранённой историей.");
  showToast("Чат с оператором открыт");
}

function endDialog() {
  track("dialog_ended");
  saveHistorySnapshot("Диалог завершён");
  removeStarter();
  document.querySelectorAll(".options-block").forEach((block) => block.remove());
  addBotMessage("Спасибо за обращение! Диалог завершён.");
  showToast("Диалог завершён");
}

function starterMarkup() {
  return `
    <div class="starter-panel" id="starterPanel">
      <p class="section-label">Популярные категории</p>
      <div class="category-grid" id="categoryGrid"></div>
    </div>`;
}

function restart() {
  saveHistorySnapshot("Новый диалог");
  track("dialog_restarted");
  currentMessages = [];
  currentSessionStarted = new Date().toISOString();
  chatBody.innerHTML = `
    <div class="chat-date">Сегодня</div>
    <div class="message-row bot-row">
      <div class="bot-avatar" aria-hidden="true">Б</div>
      <div class="message bot-message"><p>Здравствуйте! Я могу помочь с картами, переводами, вкладами и другими вопросами.</p><p>Выберите категорию или напишите свой вопрос.</p></div>
    </div>${starterMarkup()}`;
  renderCategoryGrid(document.getElementById("categoryGrid"));
  bindInitialSearch();
  chatBody.scrollTop = 0;
  showToast("Начат новый диалог");
}

function bindInitialSearch() {
  const input = document.getElementById("searchInput");
  input?.focus();
}

function showHistory() {
  const history = readStorage(HISTORY_KEY, []);
  const list = document.getElementById("historyList");
  list.innerHTML = history.length
    ? history.map((session) => `
      <article class="history-item">
        <strong>${escapeHtml(session.reason)}</strong>
        <time>${new Date(session.endedAt).toLocaleString("ru-RU")}</time>
        <p>${escapeHtml(session.messages.filter((m) => m.role === "user").slice(-1)[0]?.text || "Без текстового запроса")}</p>
      </article>`).join("")
    : `<p class="empty-state">Завершённых диалогов пока нет.</p>`;
  openModal(historyModal);
  track("history_opened");
}

function showAnalytics() {
  const events = readStorage(ANALYTICS_KEY, []);
  const searches = events.filter((event) => event.eventName === "search");
  const noResults = events.filter((event) => event.eventName === "no_results").length;
  const operator = events.filter((event) => event.eventName === "operator_confirmed").length;
  const ended = events.filter((event) => event.eventName === "dialog_ended").length;
  const answerSelections = events.filter((event) => event.eventName === "answer_selected").length;
  document.getElementById("analyticsGrid").innerHTML = `
    <article><strong>${searches.length}</strong><span>Поисковых запросов</span></article>
    <article><strong>${noResults}</strong><span>Без совпадений</span></article>
    <article><strong>${answerSelections}</strong><span>Выбранных ответов</span></article>
    <article><strong>${operator}</strong><span>Переходов к оператору</span></article>
    <article><strong>${ended}</strong><span>Завершённых диалогов</span></article>
    <article><strong>${events.length}</strong><span>Всего событий</span></article>`;
  openModal(analyticsModal);
}

function exportAnalytics() {
  const events = readStorage(ANALYTICS_KEY, []);
  const header = "timestamp,eventName,details\n";
  const rows = events.map((event) =>
    `"${event.timestamp}","${event.eventName}","${escapeHtml(JSON.stringify(event.details)).replaceAll('"', '""')}"`
  ).join("\n");
  const url = URL.createObjectURL(new Blob([header + rows], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "bank-bot-analytics.csv";
  link.click();
  URL.revokeObjectURL(url);
  track("analytics_exported");
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function updateAdminUi() {
  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !isAdmin;
  });
  document.body.classList.toggle("admin-mode", isAdmin);
}

function enableAdminMode() {
  if (isAdmin) {
    showToast("Режим администратора уже включён");
    return;
  }
  isAdmin = true;
  sessionStorage.setItem("bankBotAdmin", "true");
  track("admin_mode_enabled");
  updateAdminUi();
  showToast("Режим администратора включён");
}

function disableAdminMode() {
  isAdmin = false;
  sessionStorage.removeItem("bankBotAdmin");
  track("admin_mode_disabled");
  updateAdminUi();
  showToast("Режим администратора выключен");
}

renderCategoryGrid(document.getElementById("categoryGrid"));
bindInitialSearch();
updateAdminUi();

document.getElementById("restartButton").addEventListener("click", restart);
document.getElementById("adminExitButton").addEventListener("click", disableAdminMode);
document.getElementById("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("searchInput");
  searchRequest(input.value);
  input.value = "";
});
document.getElementById("historyButton").addEventListener("click", showHistory);
document.getElementById("analyticsButton").addEventListener("click", showAnalytics);
document.getElementById("exportAnalytics").addEventListener("click", exportAnalytics);
document.getElementById("clearHistory").addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  showHistory();
  showToast("История очищена");
});

document.getElementById("operatorButton").addEventListener("click", openOperatorModal);
document.getElementById("endButton").addEventListener("click", endDialog);
document.getElementById("closeModal").addEventListener("click", () => closeModal(operatorModal));
document.getElementById("stayWithBot").addEventListener("click", () => closeModal(operatorModal));
document.getElementById("confirmOperator").addEventListener("click", confirmOperator);

operatorModal.addEventListener("click", (event) => { if (event.target === operatorModal) closeModal(operatorModal); });
document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => closeModal(document.getElementById(button.dataset.closeModal)));
});

document.addEventListener("click", (event) => {
  const answerButton = event.target.closest("[data-answer]");
  if (answerButton) showAnswer(answerButton.dataset.answer);

  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) showCategoryQuestions(categoryButton.dataset.category);

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "categories") showCategories();
  if (action === "operator") openOperatorModal();
  if (action === "search-again") showSearchAgain();
  if (action === "answer-yes") {
    track("answer_helpful");
    endDialog();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  [operatorModal, historyModal, analyticsModal].forEach((modal) => {
    if (!modal.hidden) closeModal(modal);
  });
});
