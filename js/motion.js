// 見本の画面を、画面に入ったときに1つずつ出す。動きを減らす設定の人には何もしない。
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  var targets = document.querySelectorAll(".lt .from, .mini > div, .slots > div, .promise > div, .plan, .grow > div");
  targets.forEach(function (el, i) {
    el.classList.add("rv");
    var sib = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.transitionDelay = (Math.min(sib, 6) * 0.15) + "s";
  });
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  targets.forEach(function (el) { io.observe(el); });
})();
