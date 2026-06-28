// Fetches a recipe page on the server and returns its ingredients.
// Lives at:  /.netlify/functions/extract?url=THE_RECIPE_URL
export default async (request) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });

  const target = new URL(request.url).searchParams.get("url");
  if (!target || !/^https?:\/\//i.test(target)) {
    return json({ error: "Please pass a full http(s) recipe URL." }, 400);
  }

  // 1) grab the page (short timeout, browser-like headers so sites don't block us)
  let html;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(target, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return json({ error: `That site returned ${res.status}.`, ingredients: [] });
    html = await res.text();
  } catch (e) {
    return json({ error: "Couldn't reach that page.", ingredients: [] });
  }

  // 2) pull every <script type="application/ld+json"> block out of the page
  const blocks = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) blocks.push(m[1]);

  // 3) find a Recipe object inside any block (handles arrays and @graph wrappers)
  const isRecipe = (o) => {
    const t = o && o["@type"];
    return t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"));
  };
  const findRecipe = (node) => {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (const n of node) { const r = findRecipe(n); if (r) return r; }
      return null;
    }
    if (isRecipe(node)) return node;
    if (Array.isArray(node["@graph"])) return findRecipe(node["@graph"]);
    return null;
  };

  let recipe = null;
  for (const b of blocks) {
    try {
      const found = findRecipe(JSON.parse(b.trim()));
      if (found) { recipe = found; break; }
    } catch (e) { /* skip a block that isn't clean JSON */ }
  }

  if (!recipe) {
    return json({ error: "No structured recipe found on that page.", ingredients: [] });
  }

  // 4) tidy up the name + ingredient strings
  const decode = (s) =>
    String(s)
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ").trim();

  const raw = recipe.recipeIngredient || recipe.ingredients || [];
  const ingredients = (Array.isArray(raw) ? raw : [])
    .map((x) => (typeof x === "string" ? decode(x) : ""))
    .filter(Boolean);

  let name = Array.isArray(recipe.name) ? recipe.name[0] : recipe.name;
  name = decode(name || "");

  return json({ name, ingredients, source: target });
};
