const INDEX_NAME = "myshop_products";

function baseUrl() {
  return String(process.env.ELASTICSEARCH_URL || "").trim().replace(/\/$/, "");
}

export function isElasticsearchEnabled() {
  return Boolean(baseUrl());
}

async function esRequest(path, options = {}) {
  const method = options.method || "GET";
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Elasticsearch ${res.status}: ${text.slice(0, 200)}`);
  }
  if (method === "HEAD" || res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function ensureProductIndex() {
  if (!isElasticsearchEnabled()) return false;
  try {
    await esRequest(`/${INDEX_NAME}`, { method: "HEAD" });
    return true;
  } catch {
    // index missing
  }
  await esRequest(`/${INDEX_NAME}`, {
    method: "PUT",
    body: JSON.stringify({
      mappings: {
        properties: {
          name: { type: "text" },
          description: { type: "text" },
          category: { type: "keyword" },
          price: { type: "float" },
          stock: { type: "integer" },
          image_url: { type: "keyword" },
          created_at: { type: "date", format: "strict_date_optional_time||epoch_millis" },
        },
      },
    }),
  });
  return true;
}

function toEsDoc(product) {
  return {
    name: product.name || "",
    description: product.description || "",
    category: product.category || "",
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    image_url: product.image_url || "",
    created_at: product.created_at || new Date().toISOString(),
  };
}

export async function syncProductToElasticsearch(product) {
  if (!isElasticsearchEnabled() || !product?.id) return;
  await esRequest(`/${INDEX_NAME}/_doc/${product.id}`, {
    method: "PUT",
    body: JSON.stringify(toEsDoc(product)),
  });
}

export async function removeProductFromElasticsearch(productId) {
  if (!isElasticsearchEnabled() || !productId) return;
  try {
    await esRequest(`/${INDEX_NAME}/_doc/${productId}`, { method: "DELETE" });
  } catch (_) {
    // already gone
  }
}

export async function syncAllProductsToElasticsearch(db) {
  if (!isElasticsearchEnabled()) return { synced: 0 };
  await ensureProductIndex();
  const [rows] = await db.query("SELECT * FROM products");
  if (!rows.length) return { synced: 0 };
  const body = rows.flatMap((row) => [
    { index: { _index: INDEX_NAME, _id: String(row.id) } },
    toEsDoc(row),
  ]);
  await esRequest("/_bulk", {
    method: "POST",
    body: `${body.map((line) => JSON.stringify(line)).join("\n")}\n`,
    headers: { "Content-Type": "application/x-ndjson" },
  });
  return { synced: rows.length };
}

export async function searchProductsInElasticsearch(rawQuery = {}) {
  if (!isElasticsearchEnabled()) {
    return null;
  }

  const search = String(rawQuery.search || "").trim();
  const category = String(rawQuery.category || "").trim();
  const page = Math.max(1, Number.parseInt(rawQuery.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(rawQuery.limit, 10) || 20));
  const minPrice = rawQuery.minPrice != null ? Number(rawQuery.minPrice) : null;
  const maxPrice = rawQuery.maxPrice != null ? Number(rawQuery.maxPrice) : null;
  const sortBy = String(rawQuery.sortBy || "id").trim();
  const sortOrder = String(rawQuery.sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const must = [];
  const filter = [];

  if (search) {
    must.push({
      multi_match: {
        query: search,
        fields: ["name^3", "description", "category^2"],
        type: "best_fields",
        fuzziness: "AUTO",
      },
    });
  }
  if (category) {
    filter.push({ term: { category } });
  }
  if (minPrice != null && !Number.isNaN(minPrice)) {
    filter.push({ range: { price: { gte: minPrice } } });
  }
  if (maxPrice != null && !Number.isNaN(maxPrice)) {
    filter.push({ range: { price: { lte: maxPrice } } });
  }

  const sort = [];
  if (search && sortBy === "id") {
    sort.push({ _score: { order: "desc" } });
  } else if (sortBy === "price") {
    sort.push({ price: { order: sortOrder } });
  } else if (sortBy === "name") {
    sort.push({ "name.keyword": { order: sortOrder, unmapped_type: "keyword" } });
  } else if (sortBy === "created_at") {
    sort.push({ created_at: { order: sortOrder } });
  } else {
    sort.push({ _score: { order: "desc" } });
  }

  const queryBody = {
    from: (page - 1) * limit,
    size: limit,
    query: {
      bool: {
        ...(must.length ? { must } : { must: [{ match_all: {} }] }),
        ...(filter.length ? { filter } : {}),
      },
    },
    sort,
  };

  const data = await esRequest(`/${INDEX_NAME}/_search`, {
    method: "POST",
    body: JSON.stringify(queryBody),
  });

  const hits = data?.hits?.hits || [];
  const total = Number(data?.hits?.total?.value ?? data?.hits?.total ?? 0);
  const items = hits.map((hit) => ({ id: Number(hit._id), ...hit._source }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    engine: "elasticsearch",
  };
}
