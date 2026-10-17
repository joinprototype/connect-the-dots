// The Ask form on the home page (theme/templates/home.html). Kept in a file so the site can run
// under a strict Content-Security-Policy (script-src 'self').
// Names in, pages out. A route question turns both names into entry ids and opens the explorer.
// Any other question looks among the entries that have an answer page: an exact name or alias,
// or the only one that starts with the text, opens its page; looser matches ask "Which one?".
// With no page, Ask says why: the entry is not asked about (its type is not among the question's
// subjects), or it has no sourced answer yet. The page embeds the names it needs first;
// /data/search.json, loaded on demand, has the rest, with types and question pages (`q`).
(function () {
  var data = JSON.parse(document.getElementById("ask-data").textContent);
  var types = JSON.parse(document.getElementById("ask-types").textContent); // type id: [label, plural]
  var questions = {};
  data.questions.forEach(function (q) { questions[q.id] = q; });
  var index = null;
  // case, accents, punctuation and a leading "the" drop out: "the bolsheviks" finds "Bolsheviks"
  function norm(s) {
    return String(s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[.'\u2019]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/^the /, "");
  }
  // 0 exact, 1 starts with the text, 2 every word starts a word of the name, 3 contains it, 4 no match
  function score(name, q, words) {
    var n = norm(name);
    if (n === q) return 0;
    if (n.indexOf(q) === 0) return 1;
    var parts = n.split(" ");
    var starts = words.every(function (w) { return parts.some(function (p) { return p.indexOf(w) === 0; }); });
    return starts ? 2 : n.indexOf(q) >= 0 ? 3 : 4;
  }
  // matches, best first; within a rank the list keeps its order (best-connected, or richest answer)
  function find(list, q) {
    var words = q.split(" ");
    return list.map(function (e) {
      return { e: e, r: Math.min.apply(null, [e.name].concat(e.aliases || []).map(function (n) { return score(n, q, words); })) };
    }).filter(function (m) { return m.r < 4; }).sort(function (a, b) { return a.r - b.r; });
  }
  async function search() {
    if (!index) {
      try { index = await (await fetch("/data/search.json")).json(); } catch (err) { index = []; }
    }
    return index;
  }
  function entries(all) { return all.filter(function (e) { return e.type !== "chapter" && e.type !== "question"; }); }

  async function entryId(input) {
    var q = norm(input.value);
    if (!q) return null;
    var hit = find(data.names, q)[0];
    if (data.complete || (hit && hit.r === 0)) return hit && hit.e.id;
    // an exact name further down the full index beats a partial match among the embedded names
    var more = find(entries(await search()), q)[0];
    return more && (!hit || more.r < hit.r) ? more.e.id : hit && hit.e.id;
  }
  async function route(form) {
    var from = await entryId(form.elements.from), to = await entryId(form.elements.to);
    var miss = !from ? form.elements.from : !to ? form.elements.to : null;
    if (miss) {
      miss.setCustomValidity("No entry by that name yet. Pick one from the list.");
      miss.reportValidity();
      return;
    }
    location.href = "/x/?from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  // one row of the answer card: a link with a quiet line under it
  function row(url, name, meta, go) {
    var li = el("li"), a = el("a", go ? "ask-go" : "");
    a.href = url;
    a.append(el("span", "ask-choice-name", name));
    if (meta) a.append(el("span", "ask-choice-meta", meta));
    li.append(a);
    return li;
  }
  // the answer card goes under the form that asked
  function show(form, title, rows) {
    var card = el("div", "ask-answer"), list = el("ul", "ask-choices");
    card.append(el("p", "ask-answer-h", title));
    rows.forEach(function (r) { list.append(r); });
    card.append(list);
    form.parentNode.querySelector(".ask-result").replaceChildren(card);
    card.scrollIntoView({ block: "nearest" });
  }
  async function ask(form, q) {
    var t = norm(form.elements.x.value);
    if (!t) return;
    var pages = q.names;
    if (q.more) {
      // answers past the embedded ones, through search.json's `q` flags
      var have = {};
      pages.forEach(function (n) { have[n.id] = true; });
      pages = pages.concat(entries(await search()).filter(function (e) { return (e.q || []).indexOf(q.id) >= 0 && !have[e.id]; })
        .map(function (e) { return { id: e.id, name: e.name, aliases: e.aliases, url: q.url + e.id + "/" }; }));
    }
    var hits = find(pages, t);
    if (hits.length && hits[0].r <= 1 && (hits.length === 1 || hits[1].r > hits[0].r)) {
      location.href = hits[0].e.url;
      return;
    }
    var all = await search(), known = {};
    entries(all).forEach(function (e) { known[e.id] = e; });
    if (hits.length) {
      show(form, hits.length === 1 ? "Did you mean?" : "Which one?", hits.slice(0, 5).map(function (h) {
        var k = known[h.e.id] || {};
        return row(h.e.url, h.e.name, [types[k.type] && types[k.type][0], k.when || k.summary].filter(Boolean).join(" · "));
      }));
      return;
    }
    // no page: say why, about the entry the text names (the best-connected one when several match)
    var m = find(data.names.concat(entries(all)), t).filter(function (h) { return h.r <= 2; })[0];
    var e = m && (known[m.e.id] || m.e);
    if (!e) {
      show(form, "No sourced answer yet.", [row(q.url, "See every sourced answer ›", q.ask.replace("{x}", "…"), true)]);
      return;
    }
    var asked = !e.type || q.subjects.indexOf(e.type) >= 0;
    var rows = [row("/e/" + e.id + "/", "Open " + e.name + ": every link ›", "", true)];
    (e.q || []).forEach(function (id) {
      var page = all.filter(function (p) { return p.type === "question" && p.id === id + "/" + e.id; })[0];
      if (page && id !== q.id) rows.push(row(page.url, page.name + " ›", page.summary, true));
    });
    // routes are asked about everything: "How are Bill Gates and … connected?"
    data.questions.filter(function (o) { return o.route; }).forEach(function (o) {
      rows.push(row("/x/?from=" + encodeURIComponent(e.id), o.ask.replace("{a}", e.name).replace("{b}", "…") + " ›", "", true));
    });
    show(form, asked ? "No sourced answer yet." : "Not asked about " + (types[e.type] ? types[e.type][1] : "these") + ".", rows);
  }

  // the name typed for one question stays when another is picked
  var section = document.querySelector(".ask"), typed = "";
  var picks = Array.prototype.slice.call(document.querySelectorAll(".ask-pick input"));
  function field(id) { var p = document.getElementById("ask-panel-" + id); return p && p.querySelector("input"); }
  function pick(r) {
    var f = field(r.value);
    if (f && !f.value) f.value = typed;
  }
  section.addEventListener("input", function (ev) {
    if (ev.target.type === "radio") return;
    typed = ev.target.value;
    ev.target.setCustomValidity("");
    // a new name: the last answer card no longer applies
    var stale = ev.target.form && ev.target.form.parentNode.querySelector(".ask-result");
    if (stale) stale.replaceChildren();
  });
  picks.forEach(function (r) {
    r.addEventListener("change", function () {
      pick(r);
      try { history.replaceState(null, "", r === picks[0] ? location.pathname : "?q=" + encodeURIComponent(r.value)); } catch (err) {}
    });
  });
  // /?q=<question>&x=<name> opens the form on that question with the name filled in
  var params = new URLSearchParams(location.search);
  var preset = picks.filter(function (r) { return r.value === params.get("q"); })[0];
  typed = params.get("x") || "";
  if (preset) preset.checked = true;
  var start = picks.filter(function (r) { return r.checked; })[0];
  if (start && typed) pick(start);

  document.querySelectorAll(".ask-form").forEach(function (form) {
    var q = questions[form.dataset.q];
    // types and the answers past the embedded ones come from search.json: fetch it early
    form.addEventListener("focusin", function () { if (!q.route || !data.complete) search(); }, { once: true });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (q.route) route(form); else ask(form, q);
    });
  });
})();
