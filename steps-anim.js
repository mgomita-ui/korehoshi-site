// 「これほしが、やること」の動画。
// ・動きを減らす設定の人には再生せず、ポスター（最後の場面）だけを出す。
// ・画面の外に出ているあいだは止めておく。
(function () {
  var vids = document.querySelectorAll("video.stepvid");
  if (!vids.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    vids.forEach(function (v) {
      v.removeAttribute("autoplay");
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
    return;
  }
  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.2 });
  vids.forEach(function (v) { io.observe(v); });
})();
