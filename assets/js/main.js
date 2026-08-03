/* IPI (THAILAND) CO., LTD. — corporate site
   1. SPメニューの開閉（ハンバーガー → X変形＋全画面メニュー）
   2. お問い合わせフォームの送信
   3. お知らせのページング（10件＋もっと見る）
   4. 到達フェードイン（[data-reveal]）
   prefers-reduced-motion 尊重・JS無効でも内容は全て見える（news-archiveはJS無効時は全件表示） */

/* 外部URLはここに集約する（受け入れ条件#4）。
   ★空のあいだフォームは送信をブロックし、その旨を画面に出す。
     「受け付けました」を偽装しないため。送信先が決まったらここに入れる。 */
var FORM_ENDPOINT = "";

(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- 1. SPメニュー --- */
  var burger = document.querySelector("[data-burger]");
  var spmenu = document.querySelector("[data-spmenu]");

  if (burger && spmenu) {
    var setOpen = function (open) {
      burger.setAttribute("aria-expanded", String(open));
      spmenu.classList.toggle("is-open", open);
      spmenu.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    };

    setOpen(false);

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });

    spmenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 768) setOpen(false);
    });
  }

  /* --- 2. お問い合わせフォーム --- */
  var form  = document.querySelector("[data-contact-form]");
  var sent  = document.getElementById("form-sent");
  var error = document.getElementById("form-error");

  if (form && sent && error) {
    var showError = function (msg) {
      error.textContent = msg;
      error.hidden = false;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      error.hidden = true;

      if (!FORM_ENDPOINT) {
        showError("送信先が未設定のため、現在このフォームは送信できません。お手数ですが公開までお待ちください。");
        return;
      }

      var btn = form.querySelector(".form__submit");
      btn.disabled = true;

      fetch(FORM_ENDPOINT, {
        method: "POST",
        body: new FormData(form)
      }).then(function (res) {
        if (!res.ok) throw new Error("status " + res.status);
        form.hidden = true;
        sent.hidden = false;
        sent.scrollIntoView({ behavior: "smooth", block: "center" });
      }).catch(function () {
        showError("送信に失敗しました。時間をおいて再度お試しください。");
      }).then(function () {
        btn.disabled = false;
      });
    });

    var again = document.querySelector("[data-form-again]");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        sent.hidden = true;
        form.hidden = false;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  /* --- 3. お知らせのページング --- */
  var newsList = document.querySelector(".news-archive");
  var newsMore = document.querySelector("[data-news-more]");
  var PAGE_SIZE = 10;

  if (newsList && newsMore) {
    var newsItems = Array.prototype.slice.call(newsList.children);

    if (newsItems.length > PAGE_SIZE) {
      newsItems.slice(PAGE_SIZE).forEach(function (li) { li.hidden = true; });
      newsMore.hidden = false;

      newsMore.addEventListener("click", function () {
        var hidden = newsItems.filter(function (li) { return li.hidden; });
        hidden.slice(0, PAGE_SIZE).forEach(function (li) { li.hidden = false; });
        if (newsItems.every(function (li) { return !li.hidden; })) {
          newsMore.hidden = true;
        }
      });
    }
  }

  /* --- 4. 到達フェードイン --- */
  var targets = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (!targets.length) return;

  if (REDUCED || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.06 });

  targets.forEach(function (el) { io.observe(el); });
})();
