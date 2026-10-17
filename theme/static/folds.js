// A link to a folded section (#src-N, #timeline, #history, #how) opens it and scrolls to it.
// Used by entity and question pages; a file, so the site runs under script-src 'self'.
(function () {
  function reveal() {
    var t = location.hash && document.getElementById(location.hash.slice(1));
    if (!t) return;
    var fold = t.closest("details.fold");
    if (fold) { fold.open = true; t.scrollIntoView({ block: t === fold ? "start" : "center" }); }
  }
  addEventListener("hashchange", reveal);
  reveal();
})();
