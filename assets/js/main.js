/* IPI (THAILAND) CO., LTD. — corporate site
   1. SPメニューの開閉（ハンバーガー → X変形＋全画面メニュー）
   2. お問い合わせフォームの送信
   3. お知らせのページング（10件＋もっと見る）
   4. 到達フェードイン（[data-reveal]）
   prefers-reduced-motion 尊重・JS無効でも内容は全て見える（news-archiveはJS無効時は全件表示） */

/* 外部URLはここに集約する（受け入れ条件#4）。
   ★空のあいだフォームは送信をブロックし、その旨を画面に出す。
     「受け付けました」を偽装しないため。送信先が決まったらここに入れる。
   ★このフォームは K2 PATTAYA と Formspree のフォームを共用している（無料プランは2フォームまでのため）。
     どちらのサイトからの送信かは、contact.html の隠しフィールド _subject と site で見分ける。
     IPI 専用の受信箱が必要になったら、Formspree で新規フォームを作ってここを差し替える。 */
var FORM_ENDPOINT = "https://formspree.io/f/mreezwen";

/* --- 言語別の文言（2026-11-13 多言語化）。日本語が既定 --- */
var IPI_LANG = (document.documentElement.lang || "ja").slice(0, 2);
var IPI_T = {
  en: {
    cookieLabel: "About cookies",
    cookieText: 'This site uses cookies to analyse usage. We do not run analytics until you select "Accept". For details, see our ',
    cookieLink: "Privacy Policy", cookieAfter: ".",
    decline: "Decline", accept: "Accept",
    formUnset: "This form cannot be sent yet. Please try again later.",
    formFail: "Sending failed. Please try again later."
  },
  th: {
    cookieLabel: "เกี่ยวกับการใช้คุกกี้",
    cookieText: 'เว็บไซต์นี้ใช้คุกกี้เพื่อวิเคราะห์การใช้งาน เราจะไม่วิเคราะห์จนกว่าคุณจะเลือก "ยอมรับ" ดูรายละเอียดได้ที่',
    cookieLink: "นโยบายความเป็นส่วนตัว", cookieAfter: "",
    decline: "ปฏิเสธ", accept: "ยอมรับ",
    formUnset: "ยังไม่สามารถส่งแบบฟอร์มนี้ได้ โปรดลองใหม่ภายหลัง",
    formFail: "ส่งไม่สำเร็จ โปรดลองใหม่อีกครั้งภายหลัง"
  },
  ja: {
    cookieLabel: "Cookie の使用について",
    cookieText: "本サイトでは、利用状況の分析のために Cookie を使用します。「同意する」を選択されるまで解析は行いません。詳しくは",
    cookieLink: "プライバシーポリシー", cookieAfter: "をご覧ください。",
    decline: "拒否する", accept: "同意する",
    formUnset: "送信先が未設定のため、現在このフォームは送信できません。お手数ですが公開までお待ちください。",
    formFail: "送信に失敗しました。時間をおいて再度お試しください。"
  }
};
var IPI_TXT = IPI_T[IPI_LANG] || IPI_T.ja;

/* 言語スイッチで選んだ言語を覚える（トップの自動振り分けより優先） */
document.addEventListener("click", function (e) {
  var a = e.target.closest && e.target.closest("[data-lang]");
  if (a) { try { localStorage.setItem("langPref", a.getAttribute("data-lang")); } catch (err) {} }
});

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
        showError(IPI_TXT.formUnset);
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
        showError(IPI_TXT.formFail);
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

/* --- 5. Cookie同意バナー（Consent Mode v2 と連動） ---
   同意されるまで analytics_storage は denied のまま。同意時に granted へ更新する。
   既定値の宣言は各ページの <head>（GTMスニペットの直前）にある。 */
(function () {
  "use strict";

  var KEY = "cookie_consent";
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === "accepted" || saved === "declined") return;

  var plink = document.querySelector('a[href$="privacy.html"]');
  var phref = plink ? plink.getAttribute("href") : "privacy.html";

  var bar = document.createElement("div");
  bar.className = "cookiebar";
  bar.setAttribute("role", "dialog");
  bar.setAttribute("aria-label", IPI_TXT.cookieLabel);
  bar.innerHTML =
    '<p class="cookiebar__text">' + IPI_TXT.cookieText + '<a href="' + phref + '">' + IPI_TXT.cookieLink + '</a>' + IPI_TXT.cookieAfter + '</p>' +
    '<div class="cookiebar__actions">' +
      '<button type="button" class="cookiebar__btn" data-cookie="declined">' + IPI_TXT.decline + '</button>' +
      '<button type="button" class="cookiebar__btn cookiebar__btn--accept" data-cookie="accepted">' + IPI_TXT.accept + '</button>' +
    '</div>';
  document.body.appendChild(bar);
  setTimeout(function () { bar.classList.add("is-visible"); }, 50);

  bar.querySelectorAll("[data-cookie]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-cookie");
      try { localStorage.setItem(KEY, value); } catch (e) {}
      if (value === "accepted" && typeof window.gtag === "function") {
        window.gtag("consent", "update", { analytics_storage: "granted" });
      }
      bar.classList.remove("is-visible");
      setTimeout(function () { if (bar.parentNode) { bar.parentNode.removeChild(bar); } }, 250);
    });
  });
})();
