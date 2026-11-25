/* Search — a visual quick guide · interactivity (progressive enhancement) */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var saved = store.get("sg-theme");
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
  var themeBtn = $("#themeBtn");
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    store.set("sg-theme", next);
  });

  /* ---------- drawer ---------- */
  var drawer = $("#drawer"), navBtn = $("#navBtn");
  if (drawer && navBtn) {
    navBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = drawer.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    drawer.addEventListener("click", function (e) { if (e.target.closest("a")) drawer.classList.remove("open"); });
    document.addEventListener("click", function (e) {
      if (!drawer.contains(e.target)) { drawer.classList.remove("open"); navBtn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") drawer.classList.remove("open"); });
  }

  /* ---------- scroll spy + progress ---------- */
  var chapters = $$(".chapter[id]");
  var crumb = $("#crumb"), progress = $("#progress"), totop = $("#totop");
  var links = {};
  $$('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (!id) return;
    (links[id] = links[id] || []).push(a);
  });
  var current = null;
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    if (totop) totop.classList.toggle("show", y > 900);
    var active = null;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].getBoundingClientRect().top < 140) active = chapters[i]; else break;
    }
    if (active === current) return;
    if (current && links[current.id]) links[current.id].forEach(function (a) { a.classList.remove("active"); });
    current = active;
    if (current && links[current.id]) links[current.id].forEach(function (a) { if (a.closest(".toc,.drawer")) a.classList.add("active"); });
    if (crumb) {
      if (current) {
        var num = current.querySelector(".ch-num"), h2 = current.querySelector("h2");
        crumb.innerHTML = "<b>" + (num ? num.textContent + " · " : "") + (h2 ? h2.textContent : "") + "</b>";
      } else crumb.textContent = "A visual quick guide for developers";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- BM25 playground ---------- */
  var bm = $("#bm25demo");
  if (bm) {
    var ids = ["tf", "dl", "avgdl", "N", "df", "k1", "b"];
    var inp = {};
    ids.forEach(function (k) { inp[k] = $("#bm-" + k, bm); });
    var chart = $("#bm-chart", bm), out = $("#bm-out", bm);
    var W = 520, H = 250, P = { l: 40, r: 14, t: 14, b: 34 };
    var XMAX = 20;

    function vals() {
      var v = {};
      ids.forEach(function (k) { v[k] = parseFloat(inp[k].value); });
      if (v.df > v.N) v.df = v.N;
      return v;
    }
    function idf(N, n) { return Math.log(1 + (N - n + 0.5) / (n + 0.5)); }
    function tfPart(tf, v, dl) {
      var norm = v.k1 * (1 - v.b + v.b * dl / v.avgdl);
      return tf === 0 ? 0 : (tf * (v.k1 + 1)) / (tf + norm);
    }
    function path(fn, ymax) {
      var d = "";
      for (var i = 0; i <= 200; i++) {
        var x = (i / 200) * XMAX, y = Math.min(fn(x), ymax * 1.02);
        var px = P.l + (x / XMAX) * (W - P.l - P.r), py = H - P.b - (y / ymax) * (H - P.t - P.b);
        d += (i ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1);
      }
      return d;
    }
    function render() {
      var v = vals();
      ids.forEach(function (k) {
        var o = $('output[for="bm-' + k + '"]', bm);
        if (o) o.textContent = (k === "k1" || k === "b") ? v[k].toFixed(2) : String(v[k]);
      });
      var I = idf(v.N, v.df), T = tfPart(v.tf, v, v.dl), S = I * T;
      var ymax = 4;
      var px = P.l + (v.tf / XMAX) * (W - P.l - P.r), py = H - P.b - (Math.min(T, ymax) / ymax) * (H - P.t - P.b);
      var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="BM25 term-frequency saturation curve">';
      for (var g = 0; g <= 4; g++) {
        var gy = H - P.b - (g / 4) * (H - P.t - P.b);
        s += '<line class="d-grid" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + gy + '" y2="' + gy + '"/>';
        s += '<text class="tms" x="' + (P.l - 8) + '" y="' + (gy + 4) + '" text-anchor="end">' + g + "</text>";
      }
      for (var t = 0; t <= XMAX; t += 5) {
        var gx = P.l + (t / XMAX) * (W - P.l - P.r);
        s += '<text class="tms" x="' + gx + '" y="' + (H - P.b + 16) + '" text-anchor="middle">' + t + "</text>";
      }
      s += '<text class="ts" x="' + (W - P.r) + '" y="' + (H - 4) + '" text-anchor="end">term frequency in document (tf) →</text>';
      // saturation ceiling
      var cy = H - P.b - (Math.min(v.k1 + 1, ymax) / ymax) * (H - P.t - P.b);
      s += '<line class="d-line rank dash" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + cy + '" y2="' + cy + '"/>';
      s += '<text class="ts f-rank" x="' + (W - P.r - 4) + '" y="' + (cy - 6) + '" text-anchor="end">ceiling = k1 + 1</text>';
      // linear tf
      s += '<path class="d-line dash" d="' + path(function (x) { return x / 2.5; }, ymax) + '"/>';
      s += '<text class="ts" x="' + (P.l + 64) + '" y="' + (P.t + 22) + '">raw TF keeps growing</text>';
      // short / long docs
      s += '<path class="d-line thin idx" d="' + path(function (x) { return tfPart(x, v, v.avgdl * 0.5); }, ymax) + '"/>';
      s += '<path class="d-line thin qry" d="' + path(function (x) { return tfPart(x, v, v.avgdl * 2); }, ymax) + '"/>';
      // current
      s += '<path class="d-line acc" style="stroke-width:2.4" d="' + path(function (x) { return tfPart(x, v, v.dl); }, ymax) + '"/>';
      s += '<circle class="dot acc" cx="' + px + '" cy="' + py + '" r="5"/>';
      s += "</svg>";
      chart.innerHTML = s;
      out.innerHTML =
        'IDF = ln(1 + (N − n + 0.5)/(n + 0.5)) = <b>' + I.toFixed(3) + "</b><br>" +
        "TF part = <b>" + T.toFixed(3) + "</b> &nbsp;(max " + (v.k1 + 1).toFixed(2) + ")<br>" +
        'score(term) = IDF × TF part = <span class="big">' + S.toFixed(3) + "</span>";
    }
    ids.forEach(function (k) { inp[k].addEventListener("input", render); });
    render();
  }

  /* ---------- Levenshtein playground ---------- */
  var lv = $("#levdemo");
  if (lv) {
    var a = $("#lev-a", lv), b = $("#lev-b", lv), mOut = $("#lev-matrix", lv), rOut = $("#lev-out", lv);
    function esc(c) { return c.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
    function lev() {
      var s = a.value.toLowerCase().slice(0, 16), t = b.value.toLowerCase().slice(0, 16);
      var m = s.length, n = t.length, d = [], i, j;
      for (i = 0; i <= m; i++) { d[i] = [i]; }
      for (j = 0; j <= n; j++) { d[0][j] = j; }
      for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
        var cost = s[i - 1] === t[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      }
      // backtrace
      var on = {}, ops = { sub: 0, ins: 0, del: 0 };
      i = m; j = n; on[i + "," + j] = 1;
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1)) {
          if (s[i - 1] !== t[j - 1]) ops.sub++;
          i--; j--;
        } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { ops.del++; i--; }
        else { ops.ins++; j--; }
        on[i + "," + j] = 1;
      }
      var h = '<table class="matrix"><tr><th></th><th>ε</th>';
      for (j = 0; j < n; j++) h += "<th>" + esc(t[j]) + "</th>";
      h += "</tr>";
      for (i = 0; i <= m; i++) {
        h += "<tr><th>" + (i ? esc(s[i - 1]) : "ε") + "</th>";
        for (j = 0; j <= n; j++) {
          var cls = i === m && j === n ? "end" : on[i + "," + j] ? "path" : "";
          h += '<td class="' + cls + '">' + d[i][j] + "</td>";
        }
        h += "</tr>";
      }
      mOut.innerHTML = h + "</table>";
      var dist = d[m][n];
      var verdict = dist === 0 ? "exact match" : dist <= 2 ? "matches with fuzziness ≤ 2 (Lucene's max)" : "too far for typical fuzzy match";
      rOut.innerHTML = 'distance = <span class="big">' + dist + "</span> &nbsp;<small>(" +
        ops.sub + " substitution, " + ops.ins + " insertion, " + ops.del + " deletion) — " + verdict + "</small>";
    }
    a.addEventListener("input", lev); b.addEventListener("input", lev);
    lev();
  }

  /* ---------- glossary filter ---------- */
  var gf = $("#glFilter");
  if (gf) gf.addEventListener("input", function () {
    var q = gf.value.trim().toLowerCase();
    $$("#glossary > div").forEach(function (d) {
      d.style.display = !q || d.textContent.toLowerCase().indexOf(q) > -1 ? "" : "none";
    });
  });
})();
