import { defineStore } from "pinia";

export const useProductStore = defineStore("productStore", {
  state: () => ({
    products: [
      { id: 1, name: "아이폰 15", desc: "최신 아이폰 모델", price: 1500000, image: "/iphone15.png", category: "스마트기기" },
      { id: 2, name: "맥북 프로", desc: "Apple M2 Pro 칩셋 탑재", price: 2800000, image: "/macbook.png", category: "노트북" },
      { id: 3, name: "에어팟 프로", desc: "노이즈 캔슬링 무선 이어폰", price: 350000, image: "/airpods.png", category: "액세서리" },
    ],
    filtered: [],
  }),
  actions: {
    searchProducts(keyword) {
      const q = keyword.trim().toLowerCase();
      if (!q) {
        this.filtered = [];
        return;
      }
      this.filtered = this.products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q)
      );
    },
  },
});
