let gmesData = [];

try {
  const response = await fetch(
    "https://cdn.jsdelivr.net/gh/Hydra-Network/hydra-assets@main/gmes.json",
  );
  if (response.ok) {
    gmesData = await response.json();
  }
} catch (error) {
  console.error("Failed to fetch games:", error);
}

const FILTER_OPTIMIZE_ON = import.meta.env.PUBLIC_FILTER_OPTIMIZE === "true";
const gmes_text = FILTER_OPTIMIZE_ON ? "gᾰmes" : "games";

(() => {
  const target = document.querySelector("#gmeContainer");
  const searchInput = document.getElementById("search");

  // --- Infinite Scroll State ---
  let currentPage = 1;
  const itemsPerPage = 25;
  let currentFilteredGmes = [];
  let observer = null;

  searchInput.placeholder = `Search from ${gmesData.length} ${gmes_text}`;

  const popularGmes = [
    "Hollow Knight",
    "ULTRAKILL",
    "Celeste",
    "Katana ZERO",
    "Dead Cells",
    "Hyper Light Drifter",
    "DOOM",
    "Doom 64",
    "Balatro",
    "Castlevania",
    "Castlevania Aria of Sorrow",
    "Super Meat Boy",
    "Cuphead",
    "Among Us",
    "Cookie Clicker",
    "Baldis Basics",
    "Buckshot Roulette",
    "A Dark Room",
    "Binding of Isaac",
    "Undertale",
    "Deltarune",
    "Celeste 2",
    "Alien Hominid",
    "Chaos Faction 2",
    "Bloons TD 5",
    "Age of War",
    "Duck Life",
    "Burrito Bison",
    "Happy Wheels",
    "Cluster Rush",
    "Drive Mad",
  ];

  const allGmes = [...gmesData].sort((a, b) => {
    const aIsPopular = popularGmes.includes(a.title);
    const bIsPopular = popularGmes.includes(b.title);

    if (aIsPopular && !bIsPopular) return -1;
    if (!aIsPopular && bIsPopular) return 1;
    if (aIsPopular && bIsPopular) {
      return popularGmes.indexOf(a.title) - popularGmes.indexOf(b.title);
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });

  currentFilteredGmes = allGmes;

  const createGmeCard = (gme) => {
    const thumb_url = gme.thumb
      ? `https://raw.githubusercontent.com/Hydra-Network/hydra-assets/main/${gme.thumb}`
      : null;
    const thumb_html = thumb_url
      ? `<img src="${thumb_url}" alt="${gme.title}" class="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-110" loading="lazy"/>`
      : `<div class="w-full h-full rounded-lg bg-surface-800 flex items-center justify-center"><p class="text-text-500">No Image</p></div>`;

    return `
			<div
				onclick="opengme('${gme.file_name}', '${gme.title}', '${gme.frame}')"
				class="group relative inline-block w-64 h-40 m-2 cursor-pointer overflow-hidden rounded-xl border border-overlay bg-bg shadow-sm"
			>
				${thumb_html}
				<div class="absolute inset-0 flex items-start justify-start p-3 bg-black bg-opacity-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
					<h3 class="text-white text-lg font-bold p-2">${gme.title}</h3>
				</div>
			</div>
		`;
  };

  const renderNextBatch = () => {
    if ((currentPage - 1) * itemsPerPage >= currentFilteredGmes.length) return;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const batch = currentFilteredGmes.slice(startIndex, endIndex);

    if (batch.length === 0 && currentPage === 1) {
      target.innerHTML = `<p style='text-align: center; padding: 20px;'>No ${gmes_text} found.</p>`;
      return;
    }

    const container = target.querySelector(".gme-grid");
    if (!container) return;
    container.insertAdjacentHTML(
      "beforeend",
      batch.map(createGmeCard).join(""),
    );

    if (endIndex >= currentFilteredGmes.length) {
      const sentinel = document.getElementById("infinite-sentinel");
      if (sentinel) sentinel.style.display = "none";
    }
  };

  const fillViewport = () => {
    const sentinel = document.getElementById("infinite-sentinel");
    while (
      sentinel &&
      sentinel.getBoundingClientRect().top < window.innerHeight + 400 &&
      (currentPage - 1) * itemsPerPage < currentFilteredGmes.length
    ) {
      renderNextBatch();
      currentPage++;
    }
  };

  const initInfiniteScroll = () => {
    if (observer) observer.disconnect();

    target.innerHTML = `
			<div class="gme-grid" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; padding: 10px;"></div>
			<div id="infinite-sentinel" style="height: 50px; width: 100%;"></div>
		`;

    const sentinel = document.getElementById("infinite-sentinel");

    fillViewport();

    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fillViewport();
        }
      },
      {
        rootMargin: "400px",
      },
    );

    if (sentinel) observer.observe(sentinel);
  };

  searchInput.addEventListener("input", (event) => {
    const searchQuery = event.target.value.toLowerCase();
    currentFilteredGmes = allGmes.filter((gme) =>
      gme.title.toLowerCase().includes(searchQuery),
    );
    currentPage = 1;
    initInfiniteScroll();
  });

  initInfiniteScroll();

  // --- Frame Logic ---
  window.opengme = async (file_name, title, frameGme) => {
    const frame = document.getElementById("gmePageFrame");
    const container = document.getElementById("gmePageContainer");
    const titleEl = document.getElementById("gmePageTitle");

    titleEl.textContent = title;
    container.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    if (frameGme == "true") {
      frame.src = `https://raw.githack.com/Hydra-Network/hydra-assets/main/gmes/${file_name}`;
    } else {
      delete frame.dataset.loaded;
      frame.onload = async () => {
        if (frame.dataset.loaded) return;
        const doc = frame.contentDocument;
        const html = await fetch(
          `https://raw.githubusercontent.com/Hydra-Network/hydra-assets/main/gmes/${file_name}`,
        ).then((r) => r.text());
        doc.open();
        doc.write(html);
        doc.close();
        doc.querySelectorAll("script").forEach((s) => {
          const script = doc.createElement("script");
          script.src = s.src || "";
          if (!s.src) script.textContent = s.textContent;
          s.replaceWith(script);
        });
        frame.dataset.loaded = true;
      };
      frame.src = "/asdf.html";
    }
  };

  window.closegme = () => {
    document.getElementById("gmePageFrame").src = "";
    document.getElementById("gmePageContainer").classList.add("hidden");
    document.body.style.overflow = "";
  };

  document.getElementById("backBtn").addEventListener("click", closegme);
  document.getElementById("fullscreenBtn").addEventListener("click", () => {
    document.getElementById("gmePageFrame").requestFullscreen();
  });
})();
