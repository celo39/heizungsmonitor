(function () {
  var repo = "celo39/heizungsmonitor";
  var release = "v2026-10-18";
  var headers = { Accept: "application/vnd.github+json" };

  function text(el, value) {
    if (el) el.textContent = value;
  }

  fetch("https://api.github.com/repos/" + repo + "/releases/tags/" + release, { headers: headers })
    .then(function (response) { return response.ok ? response.json() : Promise.reject(); })
    .then(function (data) {
      var zip = (data.assets || []).filter(function (asset) { return /\.zip$/i.test(asset.name); })[0];
      var count = zip ? String(zip.download_count) : "0";
      document.querySelectorAll("[data-downloads]").forEach(function (el) { el.textContent = count; });
    })
    .catch(function () {
      document.querySelectorAll("[data-downloads]").forEach(function (el) { el.textContent = "–"; });
    });

  var root = document.getElementById("reviews");
  if (!root) return;
  var list = root.querySelector("[data-review-list]");
  var summary = root.querySelector("[data-average]");

  fetch("https://api.github.com/repos/" + repo + "/issues?labels=bewertung&state=open&per_page=100", { headers: headers })
    .then(function (response) { return response.ok ? response.json() : Promise.reject(); })
    .then(function (issues) {
      var seen = {};
      var rows = [];
      issues.forEach(function (issue) {
        if (!issue.user || seen[issue.user.login] || issue.pull_request) return;
        var rating = ratingOf(issue);
        if (!rating) return;
        seen[issue.user.login] = true;
        rows.push({
          user: issue.user.login,
          rating: rating,
          body: experienceOf(issue.body || ""),
          url: issue.html_url
        });
      });
      if (!rows.length) {
        text(summary, root.dataset.empty);
        return;
      }
      var average = rows.reduce(function (sum, row) { return sum + row.rating; }, 0) / rows.length;
      var shown = average.toFixed(1).replace(".", root.dataset.decimal || ".");
      text(summary, shown + (root.dataset.stars || " / 5"));
      text(root.querySelector("[data-review-count]"), rows.length + " " + (rows.length === 1 ? root.dataset.one : root.dataset.many));
      rows.slice(0, 8).forEach(function (row) {
        var article = document.createElement("article");
        article.className = "review";
        var meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = row.rating + (root.dataset.stars || " / 5") + " · " + row.user;
        article.appendChild(meta);
        if (row.body) {
          var paragraph = document.createElement("p");
          paragraph.textContent = row.body;
          article.appendChild(paragraph);
        }
        var link = document.createElement("a");
        link.href = row.url;
        link.rel = "noopener";
        link.target = "_blank";
        link.textContent = root.dataset.open || "Öffnen";
        article.appendChild(link);
        list.appendChild(article);
      });
    })
    .catch(function () { text(summary, root.dataset.error); });

  function ratingOf(issue) {
    var body = issue.body || "";
    var match = body.match(/###\s*Sterne\s*[\r\n]+([1-5])\b/);
    if (match) return Number(match[1]);
    var title = (issue.title || "").match(/([1-5])\s*\/\s*5/);
    return title ? Number(title[1]) : 0;
  }

  function experienceOf(body) {
    var match = body.match(/###\s*Erfahrung\s*[\r\n]+([\s\S]*?)(?:\n###\s|$)/);
    var value = match ? match[1].trim() : "";
    if (value === "_No response_" || value === "No response") return "";
    return value.slice(0, 600);
  }
})();
