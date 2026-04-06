<template>
  <div class="shop-admin-shell">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      <header class="mb-8">
        <p class="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300 mb-1">
          Admin
        </p>
        <h1 class="shop-page-title">운영 대시보드</h1>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          상품·주문·공지를 한곳에서 관리합니다. 표가 넓을 때는 가로 스크롤로 전체 열을 확인하세요.
        </p>
      </header>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div class="shop-admin-kpi">
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">오늘 주문</span>
          <span class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{{
            adminKpi.todayCount
          }}</span>
        </div>
        <div class="shop-admin-kpi">
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">오늘 매출</span>
          <span class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{{
            formatPrice(adminKpi.todayRevenue)
          }}원</span>
        </div>
        <div class="shop-admin-kpi">
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">배송 중</span>
          <span class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{{
            adminKpi.shipping
          }}</span>
        </div>
        <div class="shop-admin-kpi">
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">재고 주의 (≤5)</span>
          <span class="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">{{
            adminKpi.lowStock
          }}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="t in tabItems"
          :key="t.id"
          type="button"
          @click="selectTab(t.id)"
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium transition-all',
            activeTab === t.id ? 'shop-btn-primary' : 'shop-btn-secondary',
          ]"
        >
          {{ t.label }}
        </button>
      </div>

      <div v-show="activeTab === 'products'" class="space-y-8">
        <section class="shop-admin-card p-5 md:p-6">
          <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">상품 등록</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">필수 항목을 채운 뒤 등록하면 고객 목록에 반영됩니다.</p>
          <form @submit.prevent="addProduct" class="space-y-3 max-w-xl">
            <input v-model="newProduct.name" placeholder="상품명 *" class="shop-admin-input" required />
            <textarea
              v-model="newProduct.description"
              placeholder="설명"
              class="shop-admin-input min-h-[4rem]"
              rows="2"
            />
            <input
              v-model.number="newProduct.price"
              type="number"
              placeholder="가격 (원) *"
              class="shop-admin-input"
              required
            />
            <select v-model="newProduct.category" class="shop-input-select w-full rounded-xl py-2.5">
              <option value="">카테고리 선택</option>
              <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
            </select>
            <input
              v-model.number="newProduct.stock"
              type="number"
              min="0"
              placeholder="재고 수량"
              class="shop-admin-input"
            />
            <input
              v-model="newProduct.image_url"
              placeholder="이미지 URL (예: /images/상품.jpg)"
              class="shop-admin-input"
            />
            <button type="submit" class="shop-btn-primary px-5 py-2.5 rounded-xl text-sm w-full sm:w-auto">
              등록하기
            </button>
          </form>
        </section>

        <section>
          <div class="flex flex-wrap items-end justify-between gap-3 mb-3">
            <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">상품 목록</h2>
            <span v-if="!productsLoading" class="text-xs text-slate-500 dark:text-slate-400">
              총 {{ products.length }}건
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-2 md:hidden">표는 좌우로 스크롤할 수 있어요.</p>

          <div v-if="productsLoading" class="shop-admin-card p-6 space-y-3">
            <div
              v-for="n in 6"
              :key="'ps-' + n"
              class="h-11 rounded-xl bg-slate-200/70 dark:bg-slate-700/45 animate-pulse"
            />
          </div>
          <div v-else-if="!products.length" class="shop-admin-card p-12 text-center">
            <p class="text-slate-600 dark:text-slate-400">등록된 상품이 없습니다.</p>
            <router-link to="/products" class="shop-link-muted inline-block mt-4 text-sm">고객용 상품 목록 보기</router-link>
          </div>
          <div v-else class="shop-admin-table-wrap overflow-x-auto rounded-2xl">
            <table class="shop-admin-table min-w-[760px]">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>재고</th>
                  <th>재입고</th>
                  <th class="text-center">수정</th>
                  <th class="text-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in products" :key="p.id">
                  <td class="tabular-nums">{{ p.id }}</td>
                  <td class="font-medium text-left">{{ p.name }}</td>
                  <td>{{ p.category || "—" }}</td>
                  <td class="tabular-nums">{{ formatPrice(p.price) }}원</td>
                  <td class="tabular-nums">{{ p.stock ?? "—" }}</td>
                  <td class="tabular-nums">{{ p.restock_subscriber_count ?? 0 }}명</td>
                  <td class="text-center">
                    <button type="button" class="shop-link-muted text-xs" @click="openEdit(p)">수정</button>
                  </td>
                  <td class="text-center">
                    <button type="button" class="text-rose-600 dark:text-rose-400 text-xs font-medium hover:underline" @click="deleteProduct(p.id)">
                      삭제
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div v-show="activeTab === 'orders'" class="space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">전체 주문</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">상태 변경 시 고객 주문 내역에 반영됩니다.</p>
          </div>
          <span v-if="!ordersLoading" class="text-xs text-slate-500 dark:text-slate-400">총 {{ orders.length }}건</span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 md:hidden">표는 좌우로 스크롤할 수 있어요.</p>

        <div v-if="ordersLoading" class="shop-admin-card p-6 space-y-3">
          <div
            v-for="n in 5"
            :key="'os-' + n"
            class="h-14 rounded-xl bg-slate-200/70 dark:bg-slate-700/45 animate-pulse"
          />
        </div>
        <div v-else-if="!orders.length" class="shop-admin-card p-12 text-center">
          <p class="text-slate-600 dark:text-slate-400">아직 주문이 없습니다.</p>
          <router-link to="/order-lookup" class="shop-link-muted inline-block mt-4 text-sm">주문 조회 페이지 보기</router-link>
        </div>
        <div v-else class="shop-admin-table-wrap overflow-x-auto rounded-2xl">
          <table class="shop-admin-table min-w-[960px]">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>사용자</th>
                <th>금액</th>
                <th>상태</th>
                <th>상품</th>
                <th>주문일</th>
                <th class="min-w-[200px]">택배·송장</th>
                <th>변경</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in orders" :key="o.id" class="align-top">
                <td class="tabular-nums font-medium">{{ o.id }}</td>
                <td class="tabular-nums">{{ o.user_id }}</td>
                <td class="tabular-nums whitespace-nowrap">{{ formatPrice(o.total_price) }}원</td>
                <td class="text-sky-700 dark:text-sky-300 font-medium whitespace-nowrap">
                  {{ orderStatusLabel(o.status) }}
                </td>
                <td class="text-left text-xs text-slate-600 dark:text-slate-400 max-w-[14rem]">{{ o.products }}</td>
                <td class="text-xs whitespace-nowrap">{{ formatDate(o.created_at) }}</td>
                <td class="text-left">
                  <div v-if="carriers.length" class="flex flex-col gap-1.5">
                    <select v-model="trackingDraft[o.id].carrier" class="shop-input-select text-xs py-1.5 rounded-lg">
                      <option v-for="c in carriers" :key="c.code" :value="c.code">{{ c.label }}</option>
                    </select>
                    <input
                      v-model="trackingDraft[o.id].number"
                      type="text"
                      placeholder="송장번호"
                      class="shop-admin-input font-mono text-xs py-1.5"
                    />
                    <button
                      type="button"
                      class="shop-btn-secondary text-xs py-1.5 rounded-lg w-full"
                      @click="saveTracking(o.id)"
                    >
                      송장 저장
                    </button>
                  </div>
                  <p v-else class="text-xs text-slate-500">택배사 목록 로딩…</p>
                </td>
                <td>
                  <select
                    v-model="o.status"
                    @change="updateOrderStatus(o.id, o.status)"
                    class="shop-input-select text-xs py-1.5 rounded-lg max-w-[9.5rem]"
                  >
                    <option value="paid">결제완료</option>
                    <option value="preparing">상품준비중</option>
                    <option value="shipping">배송중</option>
                    <option value="done">배송완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-show="activeTab === 'notices'" class="max-w-4xl space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">공지사항</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            우선순위 숫자가 클수록 상단에 표시됩니다. 노출 기간을 비우면 제한 없이 표시됩니다.
          </p>
        </div>

        <form @submit.prevent="saveNotice" class="shop-admin-card p-5 md:p-6 space-y-3">
          <div class="flex flex-wrap gap-2 items-center">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{
              noticeEditingId ? `수정 (ID ${noticeEditingId})` : "새 공지"
            }}</span>
            <button
              v-if="noticeEditingId"
              type="button"
              class="shop-link-muted text-sm"
              @click="resetNoticeForm"
            >
              새로 작성
            </button>
          </div>
          <input v-model="noticeForm.title" placeholder="제목 *" class="shop-admin-input" required />
          <textarea v-model="noticeForm.body" placeholder="내용 *" class="shop-admin-input min-h-[6rem]" rows="4" required />
          <div class="flex flex-wrap gap-4 items-center text-sm">
            <label class="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <input v-model="noticeForm.is_active" type="checkbox" class="rounded border-slate-300" />
              노출 중
            </label>
            <label class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              우선순위
              <input v-model.number="noticeForm.priority" type="number" class="shop-admin-input w-24 py-1.5 inline-block" />
            </label>
          </div>
          <div class="flex flex-wrap gap-4">
            <label class="flex flex-col text-xs text-slate-600 dark:text-slate-400">
              노출 시작 (선택)
              <input v-model="noticeForm.starts_at" type="datetime-local" class="shop-admin-input mt-1" />
            </label>
            <label class="flex flex-col text-xs text-slate-600 dark:text-slate-400">
              노출 종료 (선택)
              <input v-model="noticeForm.ends_at" type="datetime-local" class="shop-admin-input mt-1" />
            </label>
          </div>
          <button type="submit" class="shop-btn-primary px-5 py-2.5 rounded-xl text-sm">
            {{ noticeEditingId ? "수정 저장" : "등록" }}
          </button>
        </form>

        <div v-if="noticesLoading" class="shop-admin-card p-6 space-y-3">
          <div
            v-for="n in 4"
            :key="'ns-' + n"
            class="h-10 rounded-xl bg-slate-200/70 dark:bg-slate-700/45 animate-pulse"
          />
        </div>
        <div v-else-if="!adminNotices.length" class="shop-admin-card p-12 text-center">
          <p class="text-slate-600 dark:text-slate-400">등록된 공지가 없습니다.</p>
          <router-link to="/notice" class="shop-link-muted inline-block mt-4 text-sm">고객용 공지 페이지 보기</router-link>
        </div>
        <div v-else class="shop-admin-table-wrap overflow-x-auto rounded-2xl">
          <table class="shop-admin-table min-w-[640px] text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>제목</th>
                <th>노출</th>
                <th>우선</th>
                <th>기간</th>
                <th>작성일</th>
                <th class="text-center">수정</th>
                <th class="text-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in adminNotices" :key="n.id">
                <td class="tabular-nums">{{ n.id }}</td>
                <td class="text-left font-medium">{{ n.title }}</td>
                <td>{{ n.is_active ? "Y" : "N" }}</td>
                <td class="tabular-nums">{{ n.priority }}</td>
                <td class="text-xs whitespace-nowrap">{{ formatNoticeRange(n.starts_at, n.ends_at) }}</td>
                <td class="text-xs whitespace-nowrap">{{ formatDate(n.created_at) }}</td>
                <td class="text-center">
                  <button type="button" class="shop-link-muted text-xs" @click="editNotice(n)">수정</button>
                </td>
                <td class="text-center">
                  <button type="button" class="text-rose-600 dark:text-rose-400 text-xs font-medium hover:underline" @click="removeNotice(n.id)">
                    삭제
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="editingProduct"
      class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
      @click.self="editingProduct = null"
    >
      <div
        class="shop-admin-card w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-slate-900"
      >
        <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          상품 수정 (ID: {{ editingProduct.id }})
        </h3>
        <form @submit.prevent="updateProduct" class="space-y-3">
          <input v-model="editForm.name" placeholder="상품명 *" class="shop-admin-input" required />
          <textarea v-model="editForm.description" placeholder="설명" class="shop-admin-input min-h-[4rem]" rows="2" />
          <input v-model.number="editForm.price" type="number" placeholder="가격 (원) *" class="shop-admin-input" required />
          <select v-model="editForm.category" class="shop-input-select w-full rounded-xl py-2.5">
            <option value="">카테고리 선택</option>
            <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
          </select>
          <input v-model.number="editForm.stock" type="number" min="0" placeholder="재고 수량" class="shop-admin-input" />
          <input v-model="editForm.image_url" placeholder="이미지 URL" class="shop-admin-input" />
          <div class="flex flex-wrap gap-2 pt-2">
            <button type="submit" class="shop-btn-primary px-5 py-2 rounded-xl text-sm">저장</button>
            <button type="button" class="shop-btn-secondary px-5 py-2 rounded-xl text-sm" @click="editingProduct = null">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import api from "../../lib/api";
import { useToastStore } from "../../store/toast";
import { formatPrice } from "../../lib/format";

const toast = useToastStore();
const activeTab = ref("products");
const tabItems = [
  { id: "products", label: "상품 관리" },
  { id: "orders", label: "주문 관리" },
  { id: "notices", label: "공지사항" },
];

const products = ref([]);
const orders = ref([]);
const carriers = ref([]);
const trackingDraft = reactive({});
const productsLoading = ref(true);
const ordersLoading = ref(true);

const adminNotices = ref([]);
const noticesLoading = ref(false);
const noticeEditingId = ref(null);
const noticeForm = reactive({
  title: "",
  body: "",
  is_active: true,
  priority: 0,
  starts_at: "",
  ends_at: "",
});

const adminKpi = computed(() => {
  const list = orders.value;
  const prods = products.value;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let todayCount = 0;
  let todayRevenue = 0;
  for (const o of list) {
    const t = o.created_at ? new Date(o.created_at).getTime() : 0;
    if (t >= startOfDay) {
      todayCount += 1;
      todayRevenue += Number(o.total_price) || 0;
    }
  }
  const shipping = list.filter((o) => ["shipping", "shipped"].includes(String(o.status || ""))).length;
  const lowStock = prods.filter((p) => p.stock != null && Number(p.stock) <= 5).length;
  return {
    todayCount,
    todayRevenue,
    shipping,
    lowStock,
  };
});

function selectTab(id) {
  activeTab.value = id;
  if (id === "notices") fetchNotices();
}

function toDatetimeLocalValue(v) {
  if (v == null || v === "") return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatNoticeRange(starts_at, ends_at) {
  if (!starts_at && !ends_at) return "제한 없음";
  const fmt = (v) => {
    if (!v) return "—";
    return new Date(v).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
  };
  return `${fmt(starts_at)} ~ ${fmt(ends_at)}`;
}

const resetNoticeForm = () => {
  noticeEditingId.value = null;
  noticeForm.title = "";
  noticeForm.body = "";
  noticeForm.is_active = true;
  noticeForm.priority = 0;
  noticeForm.starts_at = "";
  noticeForm.ends_at = "";
};

const fetchNotices = async () => {
  noticesLoading.value = true;
  try {
    const res = await api.get("/admin/notices");
    if (res.data?.success && Array.isArray(res.data.notices)) {
      adminNotices.value = res.data.notices;
    } else {
      adminNotices.value = [];
    }
  } catch (err) {
    adminNotices.value = [];
    toast.error(err.response?.data?.message || err.userMessage || "공지 목록을 불러오지 못했습니다.");
  } finally {
    noticesLoading.value = false;
  }
};

const editNotice = (n) => {
  noticeEditingId.value = n.id;
  noticeForm.title = n.title || "";
  noticeForm.body = n.body || "";
  noticeForm.is_active = Boolean(Number(n.is_active));
  noticeForm.priority = Number(n.priority) || 0;
  noticeForm.starts_at = n.starts_at ? toDatetimeLocalValue(n.starts_at) : "";
  noticeForm.ends_at = n.ends_at ? toDatetimeLocalValue(n.ends_at) : "";
};

const saveNotice = async () => {
  const payload = {
    title: noticeForm.title.trim(),
    body: noticeForm.body.trim(),
    is_active: noticeForm.is_active,
    priority: noticeForm.priority,
    starts_at: noticeForm.starts_at || null,
    ends_at: noticeForm.ends_at || null,
  };
  try {
    if (noticeEditingId.value) {
      await api.put(`/admin/notices/${noticeEditingId.value}`, payload);
      toast.success("공지가 수정되었습니다.");
    } else {
      await api.post("/admin/notices", payload);
      toast.success("공지가 등록되었습니다.");
    }
    resetNoticeForm();
    await fetchNotices();
  } catch (err) {
    toast.error(err.response?.data?.message || err.userMessage || "저장에 실패했습니다.");
  }
};

const removeNotice = async (id) => {
  if (!confirm("이 공지를 삭제할까요?")) return;
  try {
    await api.delete(`/admin/notices/${id}`);
    toast.success("삭제되었습니다.");
    if (noticeEditingId.value === id) resetNoticeForm();
    await fetchNotices();
  } catch (err) {
    toast.error(err.response?.data?.message || err.userMessage || "삭제에 실패했습니다.");
  }
};

const categoryOptions = [
  "의류",
  "악세서리",
  "뷰티",
  "디지털/가전",
  "식품",
  "생활용품",
  "스포츠/레저",
  "취미/문구",
  "가구/인테리어",
  "유아동",
  "패션잡화",
  "기타",
];

const newProduct = ref({
  name: "",
  description: "",
  price: "",
  image_url: "",
  category: "",
  stock: "",
});

const editingProduct = ref(null);
const editForm = ref({
  name: "",
  description: "",
  price: "",
  image_url: "",
  category: "",
  stock: "",
});

const fetchProducts = async () => {
  productsLoading.value = true;
  try {
    const [productsRes, countsRes] = await Promise.all([
      api.get("/products"),
      api.get("/admin/restock-subscriptions/counts").catch(() => null),
    ]);

    const list = Array.isArray(productsRes.data) ? productsRes.data : [];
    const countMap = new Map();
    const countRows = countsRes?.data?.counts;
    if (Array.isArray(countRows)) {
      for (const row of countRows) {
        countMap.set(Number(row.product_id), Number(row.pending_count || 0));
      }
    }
    products.value = list.map((p) => ({
      ...p,
      restock_subscriber_count: countMap.get(Number(p.id)) || 0,
    }));
  } catch (error) {
    products.value = [];
    toast.error(error.userMessage || "상품 목록을 불러오지 못했습니다.");
  } finally {
    productsLoading.value = false;
  }
};

const addProduct = async () => {
  try {
    await api.post("/products/add", newProduct.value);
    toast.success("상품이 등록되었습니다!");
    fetchProducts();
    newProduct.value = { name: "", description: "", price: "", image_url: "", category: "", stock: "" };
  } catch (error) {
    toast.error(error.userMessage || "상품 등록 중 오류가 발생했습니다.");
  }
};

const openEdit = (p) => {
  editingProduct.value = p;
  editForm.value = {
    name: p.name || "",
    description: p.description || "",
    price: p.price ?? "",
    image_url: p.image_url || "",
    category: p.category || "",
    stock: p.stock ?? "",
  };
};

const updateProduct = async () => {
  if (!editingProduct.value) return;
  try {
    await api.put(`/products/${editingProduct.value.id}`, editForm.value);
    toast.success("상품이 수정되었습니다!");
    editingProduct.value = null;
    fetchProducts();
  } catch (error) {
    toast.error(error.userMessage || "상품 수정 중 오류가 발생했습니다.");
  }
};

const deleteProduct = async (id) => {
  try {
    await api.delete(`/products/${id}`);
    toast.success("상품이 삭제되었습니다!");
    fetchProducts();
  } catch (error) {
    toast.error(error.userMessage || "상품 삭제 중 오류가 발생했습니다.");
  }
};

const orderStatusLabel = (status) => {
  const map = {
    paid: "결제완료",
    preparing: "상품준비중",
    shipping: "배송중",
    done: "배송완료",
    cancelled: "취소",
    shipped: "배송중",
    completed: "배송완료",
  };
  return map[status] || status;
};

const fetchCarriers = async () => {
  try {
    const res = await api.get("/shipping/carriers");
    if (res.data?.success && Array.isArray(res.data.carriers)) {
      carriers.value = res.data.carriers;
    }
  } catch {
    carriers.value = [{ code: "cj", label: "CJ대한통운" }];
  }
};

const fetchOrders = async () => {
  ordersLoading.value = true;
  try {
    const res = await api.get("/admin/orders");
    const list = Array.isArray(res.data) ? res.data : [];
    orders.value = list;
    const defaultCarrier = carriers.value[0]?.code || "cj";
    for (const o of orders.value) {
      if (!trackingDraft[o.id]) {
        trackingDraft[o.id] = {
          carrier: o.carrier_code || defaultCarrier,
          number: o.tracking_number || "",
        };
      } else {
        trackingDraft[o.id].carrier = o.carrier_code || trackingDraft[o.id].carrier || defaultCarrier;
        trackingDraft[o.id].number = o.tracking_number ?? trackingDraft[o.id].number ?? "";
      }
    }
  } catch (err) {
    orders.value = [];
    toast.error(err.response?.data?.message || err.userMessage || "주문 목록을 불러오지 못했습니다.");
  } finally {
    ordersLoading.value = false;
  }
};

const saveTracking = async (orderId) => {
  const d = trackingDraft[orderId];
  if (!d) return;
  try {
    await api.put(`/admin/orders/${orderId}/tracking`, {
      carrier_code: d.carrier,
      tracking_number: d.number,
    });
    toast.success(String(d.number || "").trim() ? "송장이 저장되었습니다." : "배송 추적 정보를 삭제했습니다.");
    await fetchOrders();
  } catch (err) {
    const msg = err.response?.data?.message || err.userMessage || "송장 저장에 실패했습니다.";
    toast.error(msg);
  }
};

const updateOrderStatus = async (id, status) => {
  try {
    await api.put(`/admin/orders/${id}/status`, { status });
    toast.success("주문 상태가 변경되었습니다!");
    await fetchOrders();
  } catch (err) {
    console.error("❌ 상태 변경 실패:", err);
    toast.error(err.userMessage || "상태 변경 중 오류가 발생했습니다.");
    await fetchOrders();
  }
};

const formatDate = (d) => new Date(d).toLocaleString();

onMounted(async () => {
  await fetchCarriers();
  await Promise.all([fetchProducts(), fetchOrders(), fetchNotices()]);
});
</script>
