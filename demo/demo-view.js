/**
 * 見本（デモ）の見せ方を、URLの後ろで切り替える。画面のスクリプトの「あと」に読む。
 *
 *   index.html                       … 要対応の一覧
 *   index.html?thread=<id>           … その会話を開く（画面本体の機能）
 *   index.html?thread=<id>&panel=ai  … 開いたうえで［AIの読み］に切り替える
 *   index.html?view=tasks            … ［やること］の欄
 *   index.html?view=waits            … ［やってもらうこと］の欄
 *
 * 画面のスクリプトは関数も state も素の var / function 宣言なので、ここから触れる。
 */
(function () {
  var p = new URLSearchParams(location.search);
  var th = p.get("thread"), panel = p.get("panel"), view = p.get("view");

  // 先回りの下書きを入れたあと、本体は返信欄に focus する。
  // 長い下書きだと末尾までスクロールした状態で写るので、頭に戻しておく。
  function replyToTop() {
    var ta = document.getElementById("reply");
    if (!ta || !ta.value) return;
    try { ta.setSelectionRange(0, 0); } catch (e) {}
    ta.scrollTop = 0;
  }
  setTimeout(replyToTop, 600);
  setTimeout(replyToTop, 1200);

  // ── 紹介資料の画面写真のための場面（2026-09-24） ──
  //   ?auto=open        … 一覧の上の「今日の自動処理」を開いた状態
  //   ?digest=1         … 今日のダイジェスト
  //   ?popup=fill       … 返信欄の［ ］を送る前に聞く窓（あおば食品）
  //   ?popup=cal        … 日程が決まったのでカレンダーに入れるか聞く窓（さくら税理士）
  //   ?popup=send       … 送る前の宛先の確認（あおば食品）
  //   ?menu=more        … ヘッダーの［⋯その他］を開いた状態
  var auto = p.get("auto"), digest = p.get("digest"), popup = p.get("popup"), menu = p.get("menu");
  if (auto === "open") setTimeout(function () { state.autoOpen = true; renderAutoAll(); }, 400);
  if (digest) setTimeout(function () { document.getElementById("digest").click(); }, 500);
  if (menu === "more") setTimeout(function () { document.getElementById("more").classList.add("open"); }, 400);
  var NL = String.fromCharCode(10);
  // ?tab=ai / ?tab=note … 会話を開いたあと、下の欄のタブを押した状態にする
  var tab = p.get("tab");
  if (tab) setTimeout(function () { var b = document.querySelector('[data-p="' + tab + '"]'); if (b) b.click(); }, 1800);
  if (popup === "fill") {
    setTimeout(function () {
      var ta = document.getElementById("reply");
      ta.value = "青葉さん" + NL + "ご連絡ありがとうございます。育児休業の条文案は［日付］までにお送りします。" + NL
        + "対象は［対象の方の人数］名で整理しますね。";
      fillHoles(ta.value);
    }, 1500);
  }
  if (popup === "cal") setTimeout(function () { api("/calendar/asks").then(function (r) { calPopup(r.asks[0]); }); }, 1500);
  if (popup === "send") {
    setTimeout(function () {
      var ta = document.getElementById("reply");
      ta.value = "青葉さん" + NL + "ご連絡ありがとうございます。育児休業の条文案は、明日18時までにお送りします。" + NL
        + "対象の方の人数だけ、念のため教えていただけますか。";
      document.getElementById("doSend").click();
    }, 1500);
  }

  if (view === "tasks" || view === "waits") {
    setTimeout(function () {
      document.getElementById(view === "tasks" ? "tabTasks" : "tabWaits").click();
      // 幅が狭いと右の欄が隠れているので、表に出す。
      document.getElementById("main").classList.add("viewing");
    }, 250);
    return;
  }
  if (th && panel) {
    // 画面本体の bootstrap が会話を開いたあとに、欄だけ差し替える。
    setTimeout(function () {
      state.panel = panel;
      openThread(th);
    }, 250);
  }
})();
