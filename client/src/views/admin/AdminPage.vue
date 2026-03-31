<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">관리자 페이지</h1>

    <div class="flex flex-wrap gap-2 mb-6">
      <button
        @click="activeTab = 'products'"
        :class="[
          'px-4 py-2 rounded',
          activeTab === 'products' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        ]"
      >
        상품 관리
      </button>
      <button
        @click="activeTab = 'orders'"
        :class="[
          'px-4 py-2 rounded',
          activeTab === 'orders' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        ]"
      >
        주문 관리
      </button>
      <button
        @click="activeTab = 'notices'; fetchNotices()"
        :class="[
          'px-4 py-2 rounded',
          activeTab === 'notices' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        ]"
      >
        공지사항
      </button>
    </div>

    <div v-if="activeTab === 'products'">
      <h2 class="text-lg font-semibold mb-4">상품 등록</h2>
      <form @submit.prevent="addProduct" class="space-y-3 mb-6 max-w-xl">
        <input v-model="newProduct.name" placeholder="상품명 *" class="border p-2 rounded w-full" required />
        <textarea v-model="newProduct.description" placeholder="설명" class="border p-2 rounded w-full" rows="2"></textarea>
        <input v-model.number="newProduct.price" type="number" placeholder="가격 (원) *" class="border p-2 rounded w-full" required />
        <select v-model="newProduct.category" class="border p-2 rounded w-full">
          <option value="">카테고리 선택</option>
          <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <input v-model.number="newProduct.stock" type="number" min="0" placeholder="재고 수량" class="border p-2 rounded w-full" />
        <input v-model="newProduct.image_url" placeholder="이미지 URL (예: /images/상품.jpg)" class="border p-2 rounded w-full" />
        <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          등록하기
        </button>
      </form>

      <h2 class="text-lg font-semibold mb-2">상품 목록</h2>
      <div class="overflow-x-auto">
        <table class="w-full border">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 border">ID</th>
              <th class="p-2 border">상품명</th>
              <th class="p-2 border">카테고리</th>
              <th class="p-2 border">가격</th>
              <th class="p-2 border">재고</th>
              <th class="p-2 border">재입고 신청</th>
              <th class="p-2 border">수정</th>
              <th class="p-2 border">삭제</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in products" :key="p.id" class="text-center">
              <td class="p-2 border">{{ p.id }}</td>
              <td class="p-2 border text-left">{{ p.name }}</td>
              <td class="p-2 border">{{ p.category || "-" }}</td>
              <td class="p-2 border">{{ formatPrice(p.price) }}원</td>
              <td class="p-2 border">{{ p.stock ?? "-" }}</td>
              <td class="p-2 border">{{ p.restock_subscriber_count ?? 0 }}명</td>
              <td class="p-2 border">
                <button type="button" @click="openEdit(p)" class="text-blue-500 hover:underline">수정</button>
              </td>
              <td class="p-2 border">
                <button type="button" @click="deleteProduct(p.id)" class="text-red-500 hover:underline">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      
      <div
        v-if="editingProduct"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="editingProduct = null"
      >
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">상품 수정 (ID: {{ editingProduct.id }})</h3>
          <form @submit.prevent="updateProduct" class="space-y-3">
            <input v-model="editForm.name" placeholder="상품명 *" class="border p-2 rounded w-full" required />
            <textarea v-model="editForm.description" placeholder="설명" class="border p-2 rounded w-full" rows="2"></textarea>
            <input v-model.number="editForm.price" type="number" placeholder="가격 (원) *" class="border p-2 rounded w-full" required />
            <select v-model="editForm.category" class="border p-2 rounded w-full">
              <option value="">카테고리 선택</option>
              <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
            </select>
            <input v-model.number="editForm.stock" type="number" min="0" placeholder="재고 수량" class="border p-2 rounded w-full" />
            <input v-model="editForm.image_url" placeholder="이미지 URL" class="border p-2 rounded w-full" />
            <div class="flex gap-2 pt-2">
              <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">저장</button>
              <button type="button" @click="editingProduct = null" class="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">취소</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'orders'">
      <h2 class="text-lg font-semibold mb-2">전체 주문 내역</h2>
      <div class="overflow-x-auto">
        <table class="w-full border min-w-[960px]">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 border">주문번호</th>
              <th class="p-2 border">사용자 ID</th>
              <th class="p-2 border">총 금액</th>
              <th class="p-2 border">상태</th>
              <th class="p-2 border">상품 목록</th>
              <th class="p-2 border">주문일</th>
              <th class="p-2 border w-[200px]">택배·송장</th>
              <th class="p-2 border">상태 변경</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id" class="text-center align-top">
              <td class="p-2 border">{{ o.id }}</td>
              <td class="p-2 border">{{ o.user_id }}</td>
              <td class="p-2 border">{{ formatPrice(o.total_price) }}원</td>
              <td class="p-2 border text-blue-500 font-semibold">{{ orderStatusLabel(o.status) }}</td>
              <td class="p-2 border text-gray-600 text-left text-sm">{{ o.products }}</td>
              <td class="p-2 border whitespace-nowrap text-sm">{{ formatDate(o.created_at) }}</td>
              <td class="p-2 border text-left">
                <div v-if="carriers.length" class="flex flex-col gap-1">
                  <select
                    v-model="trackingDraft[o.id].carrier"
                    class="border p-1 rounded w-full text-sm"
                  >
                    <option v-for="c in carriers" :key="c.code" :value="c.code">{{ c.label }}</option>
                  </select>
                  <input
                    v-model="trackingDraft[o.id].number"
                    type="text"
                    placeholder="송장번호"
                    class="border p-1 rounded w-full text-sm font-mono"
                  />
                  <button
                    type="button"
                    class="text-xs bg-slate-700 text-white px-2 py-1 rounded hover:bg-slate-800"
                    @click="saveTracking(o.id)"
                  >
                    송장 저장
                  </button>
                </div>
                <p v-else class="text-xs text-gray-500">택배사 목록 로딩…</p>
              </td>
              <td class="p-2 border">
                <select v-model="o.status" @change="updateOrderStatus(o.id, o.status)" class="border p-1 rounded text-sm max-w-[9rem]">
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

    <div v-else-if="activeTab === 'notices'" class="max-w-4xl">
      <h2 class="text-lg font-semibold mb-4">공지사항 관리</h2>
      <p class="text-sm text-gray-600 mb-4">
        우선순위 숫자가 클수록 상단에 표시됩니다. 노출 기간을 비우면 제한 없이 표시됩니다.
      </p>

      <form @submit.prevent="saveNotice" class="space-y-3 mb-8 p-4 border rounded-lg bg-gray-50/80">
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-sm font-medium text-gray-700">{{ noticeEditingId ? `수정 (ID ${noticeEditingId})` : "새 공지" }}</span>
          <button
            v-if="noticeEditingId"
            type="button"
            class="text-sm text-blue-600 hover:underline"
            @click="resetNoticeForm"
          >
            새로 작성
          </button>
        </div>
        <input v-model="noticeForm.title" placeholder="제목 *" class="border p-2 rounded w-full" required />
        <textarea v-model="noticeForm.body" placeholder="내용 *" class="border p-2 rounded w-full" rows="4" required />
        <div class="flex flex-wrap gap-4 items-center">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="noticeForm.is_active" type="checkbox" />
            노출 중
          </label>
          <label class="flex items-center gap-2 text-sm">
            우선순위
            <input v-model.number="noticeForm.priority" type="number" class="border p-1 rounded w-24" />
          </label>
        </div>
        <div class="flex flex-wrap gap-4">
          <label class="flex flex-col text-sm text-gray-600">
            노출 시작 (선택)
            <input v-model="noticeForm.starts_at" type="datetime-local" class="border p-2 rounded mt-1" />
          </label>
          <label class="flex flex-col text-sm text-gray-600">
            노출 종료 (선택)
            <input v-model="noticeForm.ends_at" type="datetime-local" class="border p-2 rounded mt-1" />
          </label>
        </div>
        <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          {{ noticeEditingId ? "수정 저장" : "등록" }}
        </button>
      </form>

      <div v-if="noticesLoading" class="text-gray-500">불러오는 중...</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full border text-sm">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 border">ID</th>
              <th class="p-2 border">제목</th>
              <th class="p-2 border">노출</th>
              <th class="p-2 border">우선순위</th>
              <th class="p-2 border">기간</th>
              <th class="p-2 border">작성일</th>
              <th class="p-2 border">수정</th>
              <th class="p-2 border">삭제</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in adminNotices" :key="n.id" class="text-center align-middle">
              <td class="p-2 border">{{ n.id }}</td>
              <td class="p-2 border text-left">{{ n.title }}</td>
              <td class="p-2 border">{{ n.is_active ? "Y" : "N" }}</td>
              <td class="p-2 border">{{ n.priority }}</td>
              <td class="p-2 border text-xs whitespace-nowrap">
                {{ formatNoticeRange(n.starts_at, n.ends_at) }}
              </td>
              <td class="p-2 border text-xs whitespace-nowrap">{{ formatDate(n.created_at) }}</td>
              <td class="p-2 border">
                <button type="button" class="text-blue-600 hover:underline" @click="editNotice(n)">수정</button>
              </td>
              <td class="p-2 border">
                <button type="button" class="text-red-600 hover:underline" @click="removeNotice(n.id)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import api from "../../lib/api";
import { useToastStore } from "../../store/toast";
import { formatPrice } from "../../lib/format";

const toast = useToastStore();
const activeTab = ref("products");
const products = ref([]);
const orders = ref([]);
const carriers = ref([]);
const trackingDraft = reactive({});

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
  "의류", "악세서리", "뷰티", "디지털/가전", "식품", "생활용품", "스포츠/레저",
  "취미/문구", "가구/인테리어", "유아동", "패션잡화", "기타",
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
  const res = await api.get("/admin/orders");
  orders.value = res.data;
  const defaultCarrier = carriers.value[0]?.code || "cj";
  for (const o of orders.value) {
    trackingDraft[o.id] = {
      carrier: o.carrier_code || defaultCarrier,
      number: o.tracking_number || "",
    };
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
    const msg =
      err.response?.data?.message ||
      err.userMessage ||
      "송장 저장에 실패했습니다.";
    toast.error(msg);
  }
};

const updateOrderStatus = async (id, status) => {
  try {
    await api.put(`/admin/orders/${id}/status`, { status });
    toast.success("주문 상태가 변경되었습니다!");
  } catch (err) {
    console.error("❌ 상태 변경 실패:", err);
    toast.error(err.userMessage || "상태 변경 중 오류가 발생했습니다.");
  }
};

const formatDate = (d) => new Date(d).toLocaleString();

onMounted(async () => {
  fetchProducts();
  await fetchCarriers();
  await fetchOrders();
  await fetchNotices();
});
</script>
