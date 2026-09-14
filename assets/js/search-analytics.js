(function () {
  function initSearchAnalytics() {
    var input = document.getElementById("search-query");
    var output = document.getElementById("search-results");

    if (!input || !output) return;

    var timer;
    var trackedTerms = {};
    var trackedCount = 0;
    var maxSearchEvents = 30;
    var storageKey = "andgrid_search_terms";
    var status = document.createElement("p");
    status.id = "search-result-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    output.parentNode.insertBefore(status, output);

    function pushEvent(event) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(event);
    }

    try {
      trackedTerms = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      trackedCount = Object.keys(trackedTerms).length;
    } catch (error) {
      trackedTerms = {};
      trackedCount = 0;
    }

    function reportSearch() {
      var term = input.value.trim();
      var resultCount = output.children.length;

      if (!term) {
        status.textContent = "";
        return;
      }

      status.textContent = resultCount
        ? "검색 결과 " + resultCount + "개"
        : "검색 결과가 없습니다.";

      if (term.length < 2 || trackedTerms[term] || trackedCount >= maxSearchEvents) return;
      trackedTerms[term] = true;
      trackedCount += 1;

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(trackedTerms));
      } catch (error) {}

      pushEvent({
        event: "site_search",
        search_term: term,
        search_result_count: resultCount,
        site_hostname: window.location.hostname,
        page_path: window.location.pathname,
      });
    }

    input.addEventListener("input", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(reportSearch, 700);
    });

    output.addEventListener("click", function (event) {
      var link = event.target.closest("li a");
      if (!link) return;

      window.clearTimeout(timer);
      reportSearch();
      if (input.value.trim().length < 2) return;

      var item = link.closest("li");
      var items = Array.prototype.slice.call(output.children);
      var title = link.querySelector(".font-bold");

      pushEvent({
        event: "site_search_result_click",
        search_term: input.value.trim(),
        search_result_count: output.children.length,
        search_result_position: items.indexOf(item) + 1,
        search_result_title: title ? title.textContent.trim() : "",
        search_result_url: link.href,
        site_hostname: window.location.hostname,
        page_path: window.location.pathname,
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearchAnalytics);
  } else {
    initSearchAnalytics();
  }
})();
