<template>
  <div
    class="min-h-screen py-12 px-6
           bg-gradient-to-b from-slate-100 to-slate-200
           dark:from-zinc-950 dark:to-neutral-950
           text-neutral-800 dark:text-gray-100"
  >
    <div class="max-w-lg mx-auto">
      <h1 class="text-2xl font-bold mb-2">견적문의</h1>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
        대량 구매·맞춤 견적이 필요하시면 아래 양식을 작성해 주세요. 확인 후 연락드립니다.
      </p>

      <form
        @submit.prevent="submit"
        class="space-y-4 p-6 rounded-2xl bg-white/90 dark:bg-white/10 border border-neutral-200/60 dark:border-neutral-600/40"
      >
        <div>
          <label class="block text-sm font-medium mb-1">이름 *</label>
          <input v-model="form.name" type="text" required class="shop-admin-input w-full" placeholder="홍길동" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">이메일 *</label>
          <input v-model="form.email" type="email" required class="shop-admin-input w-full" placeholder="example@email.com" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">연락처</label>
          <input v-model="form.phone" type="tel" class="shop-admin-input w-full" placeholder="010-0000-0000" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">문의 내용 *</label>
          <textarea
            v-model="form.message"
            required
            rows="5"
            class="shop-admin-input w-full min-h-[8rem]"
            placeholder="희망 상품, 수량, 납기 등을 적어 주세요."
          />
        </div>
        <button type="submit" :disabled="submitting" class="shop-btn-primary w-full py-2.5 rounded-lg font-semibold disabled:opacity-60">
          {{ submitting ? "전송 중..." : "문의 보내기" }}
        </button>
      </form>

      <p v-if="success" class="mt-4 text-sm text-green-600 dark:text-green-400">{{ success }}</p>
      <p v-if="error" class="mt-4 text-sm text-red-500">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import api from "../../lib/api";
import { useToastStore } from "../../store/toast";

const toast = useToastStore();
const submitting = ref(false);
const success = ref("");
const error = ref("");
const form = reactive({
  name: "",
  email: "",
  phone: "",
  message: "",
});

const submit = async () => {
  if (submitting.value) return;
  submitting.value = true;
  success.value = "";
  error.value = "";
  try {
    const res = await api.post("/quote-inquiries", { ...form });
    success.value = res.data?.message || "견적 문의가 접수되었습니다.";
    toast.success(success.value);
    form.name = "";
    form.email = "";
    form.phone = "";
    form.message = "";
  } catch (err) {
    error.value = err.userMessage || "문의 전송에 실패했습니다.";
    toast.error(error.value);
  } finally {
    submitting.value = false;
  }
};
</script>
