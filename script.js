/* =========================================================================
   ДАННЫЕ СБОРА
   -------------------------------------------------------------------------
   Цель — в рублях (₽), из официальной калькуляции клиники им. Турнера.
   Собранная сумма отслеживается в тенге (₸), так как пожертвования идут
   через Kaspi. Курс — приблизительный и нужен только для прогресс-бара;
   обновите goalRub, raisedKzt и exchangeKztPerRub, когда появятся новые
   цифры — весь сайт пересчитается сам, HTML трогать не нужно.
   ========================================================================= */
const CAMPAIGN = {
  goalRub: 1560000,       // цель на четвёртую операцию (без перелёта и проживания)
  raisedKzt: 505797,      // сколько уже собрано, в тенге
  exchangeKztPerRub: 6.0, // приблизительный курс: сколько тенге за 1 рубль
};

/* =========================================================================
   УТИЛИТЫ ФОРМАТИРОВАНИЯ
   ========================================================================= */
function formatRub(amount) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(amount)) + " ₽";
}
function formatKzt(amount) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(amount)) + " ₸";
}

function getRaisedInRub() {
  return CAMPAIGN.raisedKzt / CAMPAIGN.exchangeKztPerRub;
}

function getPercent() {
  const raisedRub = getRaisedInRub();
  return Math.max(0, Math.min(100, (raisedRub / CAMPAIGN.goalRub) * 100));
}

/* =========================================================================
   ОТРИСОВКА ПРОГРЕССА (hero, шапка, детальный блок, мобильная панель)
   ========================================================================= */
function renderProgress() {
  const percent = getPercent();
  const raisedRub = getRaisedInRub();
  const remainingRub = Math.max(0, CAMPAIGN.goalRub - raisedRub);
  // Показываем один знак после запятой ниже 1%, чтобы не округлять честный
  // прогресс до "0%", когда на самом деле уже что-то собрано.
  const percentDisplay = percent > 0 && percent < 1 ? "< 1" : Math.round(percent);
  const percentRounded = Math.round(percent);

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("heroRaised", formatKzt(CAMPAIGN.raisedKzt));
  setText("heroGoal", formatRub(CAMPAIGN.goalRub));
  setText("heroPercent", percentDisplay + "%");
  setText("heroRemaining", "≈ " + formatRub(remainingRub));
  setText("heroRingPercent", percentDisplay + "%");
  setText("chipPercent", percentDisplay + "%");
  setText("bigRingPercent", percentDisplay + "%");
  setText("statsRaised", formatKzt(CAMPAIGN.raisedKzt) + " (≈ " + formatRub(raisedRub) + ")");
  setText("statsRemaining", "≈ " + formatRub(remainingRub));
  setText("miniLabel", `Собрано ${percentDisplay}% из ${formatRub(CAMPAIGN.goalRub)}`);

  const heroFill = document.getElementById("heroProgressFill");
  if (heroFill) {
    heroFill.style.width = percent + "%";
    heroFill.setAttribute("aria-valuenow", percentRounded);
    heroFill.setAttribute("aria-label", `Собрано ${percentRounded}% от цели`);
  }
  const detailFill = document.getElementById("detailProgressFill");
  if (detailFill) detailFill.style.width = percent + "%";
  const miniFill = document.getElementById("miniFill");
  if (miniFill) miniFill.style.width = percent + "%";

  // Малое кольцо (шапка + hero-бейдж): circumference = 2 * PI * 26 ≈ 163.4
  const smallCircumference = 2 * Math.PI * 26;
  [document.getElementById("heroRing"), document.getElementById("chipRing")].forEach((ring) => {
    if (!ring) return;
    ring.style.strokeDasharray = smallCircumference;
    ring.style.strokeDashoffset = smallCircumference - (percent / 100) * smallCircumference;
  });

  // Большое кольцо: circumference = 2 * PI * 115 ≈ 722.6
  const bigRing = document.getElementById("bigRing");
  if (bigRing) {
    const bigCircumference = 2 * Math.PI * 115;
    bigRing.style.strokeDasharray = bigCircumference;
    bigRing.style.strokeDashoffset = bigCircumference - (percent / 100) * bigCircumference;
  }
}

/* =========================================================================
   ПОЯВЛЕНИЕ БЛОКОВ ПРИ ПРОКРУТКЕ
   ========================================================================= */
function initRevealOnScroll() {
  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  targets.forEach((el) => observer.observe(el));
}

/* =========================================================================
   МОБИЛЬНОЕ МЕНЮ
   ========================================================================= */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Открыть меню");
    });
  });
}

/* =========================================================================
   FAQ АККОРДЕОН
   ========================================================================= */
function initFaq() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      items.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        other.querySelector(".faq-answer").style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add("is-open");
        question.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
}

/* =========================================================================
   ЛАЙТБОКС ГАЛЕРЕИ
   ========================================================================= */
function initLightbox() {
  const items = Array.from(document.querySelectorAll(".gallery-item"));
  if (!items.length) return;

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");
  let currentIndex = 0;
  let lastFocused = null;

  function open(index) {
    currentIndex = index;
    const img = items[currentIndex].querySelector("img");
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lastFocused = document.activeElement;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  function show(delta) {
    currentIndex = (currentIndex + delta + items.length) % items.length;
    const img = items[currentIndex].querySelector("img");
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
  }

  items.forEach((item, i) => item.addEventListener("click", () => open(i)));
  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => show(-1));
  nextBtn.addEventListener("click", () => show(1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(-1);
    if (e.key === "ArrowRight") show(1);
  });
}

/* =========================================================================
   ВИДЕО: замена постера на встраиваемый плеер по клику
   -------------------------------------------------------------------------
   По умолчанию используется локальный файл assets/videos/message.mp4.
   Чтобы использовать YouTube, замените VIDEO_SOURCE.type на "youtube"
   и укажите VIDEO_SOURCE.youtubeId.
   ========================================================================= */
const VIDEO_SOURCE = {
  type: "local", // "local" | "youtube"
  localSrc: "assets/videos/message.mp4",
  youtubeId: "",
};

function initVideo() {
  const wrap = document.getElementById("videoWrap");
  const playBtn = document.getElementById("videoPlayBtn");
  if (!wrap || !playBtn) return;

  playBtn.addEventListener("click", () => {
    let player;
    if (VIDEO_SOURCE.type === "youtube" && VIDEO_SOURCE.youtubeId) {
      player = document.createElement("iframe");
      player.src = `https://www.youtube-nocookie.com/embed/${VIDEO_SOURCE.youtubeId}?autoplay=1&rel=0`;
      player.title = "Видеообращение семьи Темирлана";
      player.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
      player.allowFullscreen = true;
      wrap.innerHTML = "";
      wrap.appendChild(player);
      return;
    }

    player = document.createElement("video");
    player.src = VIDEO_SOURCE.localSrc;
    player.controls = true;
    player.setAttribute("playsinline", "");
    player.style.width = "100%";
    player.style.height = "100%";
    player.style.objectFit = "contain";
    player.style.background = "#000";

    // Если файл не найден или браузер не может его воспроизвести —
    // показываем понятное сообщение вместо чёрного экрана.
    player.addEventListener("error", () => {
      wrap.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; padding:24px; text-align:center;">
        <p style="color:#fff; font-size:15px;">Не получилось загрузить видео. Посмотрите его в Instagram по ссылке ниже.</p>
      </div>`;
    });

    wrap.innerHTML = "";
    wrap.appendChild(player);
    player.play().catch(() => { /* автовоспроизведение заблокировано браузером — не страшно, можно нажать play вручную */ });
  });
}

/* =========================================================================
   МОДАЛЬНОЕ ОКНО ПОЖЕРТВОВАНИЯ
   ========================================================================= */
function initModal(triggerSelector, modalId, closeId) {
  const modal = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeId);
  if (!modal) return;

  let lastFocused = null;

  function open(e) {
    if (e) e.preventDefault();
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (closeBtn) closeBtn.focus();
  }
  function close() {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll(triggerSelector).forEach((btn) => {
    btn.addEventListener("click", open);
  });
  if (closeBtn) closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  modal.querySelectorAll("[data-modal-scroll]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      close();
      document.getElementById("donate").scrollIntoView({ behavior: "smooth" });
    });
  });

  return { open, close };
}

/* =========================================================================
   КОПИРОВАНИЕ РЕКВИЗИТОВ
   ========================================================================= */
function initCopyButtons() {
  const liveRegion = document.getElementById("liveRegion");
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      const originalLabel = btn.textContent;
      try {
        await navigator.clipboard.writeText(value);
        btn.textContent = "Скопировано ✓";
      } catch {
        btn.textContent = "Не удалось скопировать";
      }
      if (liveRegion) liveRegion.textContent = "Реквизиты скопированы в буфер обмена";
      setTimeout(() => { btn.textContent = originalLabel; }, 2200);
    });
  });
}

/* =========================================================================
   ГОД В ПОДВАЛЕ
   ========================================================================= */
function initFooterYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* =========================================================================
   ЗАЩИТА ССЫЛОК-ЗАГЛУШЕК
   -------------------------------------------------------------------------
   Пока REAL_CONTACTS не заполнены, соответствующие ссылки помечены
   aria-disabled="true" — клики по ним ничего не делают, вместо того
   чтобы уводить человека в никуда по href="#".
   ========================================================================= */
function initDisabledLinksGuard() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('[aria-disabled="true"]');
    if (link) e.preventDefault();
  });
}

/* =========================================================================
   КОНТАКТЫ И ССЫЛКИ
   -------------------------------------------------------------------------
   Вставьте сюда готовые ссылки — прямо как они выглядят в адресной строке
   или в кнопке "Поделиться" в самом приложении:
     whatsappUrl  — например "https://wa.me/77001234567"
                    (получить: WhatsApp → три точки → Настройки →
                     ваш профиль → скопировать ссылку на чат,
                     либо просто "https://wa.me/НОМЕР_БЕЗ_ПЛЮСА_И_ПРОБЕЛОВ")
     telegramUrl  — например "https://t.me/temirlan_help"
     instagramUrl — например "https://instagram.com/temirlan.help"
     phone        — просто номер, например "+7 700 000 00 00" (для звонка)
   Оставьте поле пустым "" — соответствующая кнопка на сайте покажет
   "Скоро будет здесь" и никуда не поведёт, пока вы не впишете ссылку.
   ========================================================================= */
const REAL_CONTACTS = {
  phone: "+7 771 198 66 79",
  whatsappUrl: "https://wa.me/qr/NHY6UXRMWLEEA1",
  telegramUrl: "https://t.me/ZhanaraBerdygozhina",
  instagramUrl: "https://www.instagram.com/help.temirlan?igsh=MWRtcDFpYWo4enhneA==",
};

function initContactLinks() {
  const phoneEl = document.getElementById("contactPhone");
  if (REAL_CONTACTS.phone) {
    const telHref = "tel:" + REAL_CONTACTS.phone.replace(/[^+\d]/g, "");
    if (phoneEl) {
      phoneEl.href = telHref;
      phoneEl.querySelector(".contact-value").textContent = REAL_CONTACTS.phone;
      phoneEl.removeAttribute("aria-disabled");
    }
  }
  const waEl = document.getElementById("contactWhatsapp");
  if (REAL_CONTACTS.whatsappUrl && waEl) {
    waEl.href = REAL_CONTACTS.whatsappUrl;
    waEl.target = "_blank"; waEl.rel = "noopener";
    waEl.querySelector(".contact-value").textContent = "Написать сообщение";
    waEl.removeAttribute("aria-disabled");
  }
  const tgEl = document.getElementById("contactTelegram");
  if (REAL_CONTACTS.telegramUrl && tgEl) {
    tgEl.href = REAL_CONTACTS.telegramUrl;
    tgEl.target = "_blank"; tgEl.rel = "noopener";
    tgEl.querySelector(".contact-value").textContent = "Открыть чат";
    tgEl.removeAttribute("aria-disabled");
  }
  const igEl = document.getElementById("contactInstagram");
  if (REAL_CONTACTS.instagramUrl) {
    if (igEl) {
      igEl.href = REAL_CONTACTS.instagramUrl; igEl.target = "_blank"; igEl.rel = "noopener";
      igEl.querySelector(".contact-value").textContent = "Открыть профиль";
      igEl.removeAttribute("aria-disabled");
    }
  }
}

/* =========================================================================
   КНОПКА «ПОДЕЛИТЬСЯ»
   -------------------------------------------------------------------------
   Семья прямо просит распространять историю, даже если человек не может
   помочь деньгами. Используем нативный Web Share API там, где он
   поддерживается, и запасной вариант — копирование ссылки.
   ========================================================================= */
function initShareButton() {
  const btn = document.getElementById("shareBtn");
  if (!btn) return;
  const liveRegion = document.getElementById("liveRegion");

  btn.addEventListener("click", async () => {
    const shareData = {
      title: "Помочь Темирлану — операция на позвоночнике",
      text: "Темирлану 9 лет, врождённый сколиоз 4 степени. Нужна операция в клинике им. Турнера. Даже репост уже помогает.",
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* пользователь отменил — это нормально */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareData.url);
      const original = btn.textContent;
      btn.textContent = "Ссылка скопирована ✓";
      if (liveRegion) liveRegion.textContent = "Ссылка на страницу скопирована в буфер обмена";
      setTimeout(() => { btn.textContent = original; }, 2200);
    } catch {
      window.prompt("Скопируйте ссылку и отправьте её кому-нибудь:", shareData.url);
    }
  });
}

/* =========================================================================
   ИНИЦИАЛИЗАЦИЯ
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderProgress();
  initRevealOnScroll();
  initMobileNav();
  initFaq();
  initLightbox();
  initVideo();
  initDisabledLinksGuard();
  initModal("[data-open-donate]", "donateModal", "donateModalClose");
  initContactLinks();
  initCopyButtons();
  initFooterYear();
  initShareButton();
});
