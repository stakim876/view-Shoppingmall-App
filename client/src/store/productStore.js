import { defineStore } from "pinia";
import api from "../lib/api";

export const useProductStore = defineStore("productStore", {
  state: () => ({
    products: [
      { id: 1, name: "아이폰 15", desc: "최신 아이폰 모델", price: 1500000, image: "/iphone15.png", category: "스마트기기" },
      { id: 2, name: "맥북 프로", desc: "Apple M2 Pro 칩셋 탑재", price: 2800000, image: "/macbook.png", category: "노트북" },
      { id: 3, name: "에어팟 프로", desc: "노이즈 캔슬링 무선 이어폰", price: 350000, image: "/airpods.png", category: "액세서리" },
      { id: 4, name: "애플워치 9", desc: "건강 모니터링 기능 강화", price: 650000, image: "/images/applewatch-main.png", category: "스마트기기" },
      { id: 5, name: "아이패드 프로", desc: "M2 칩 탑재 아이패드", price: 1400000, image: "/images/a485248b-561b-4ee0-82fa-83ef371c1a58.jpg", category: "태블릿" },
      { id: 6, name: "뉴발란스 파스텔 스니커즈", desc: "라벤더와 코랄 포인트의 캐주얼 스니커즈.", price: 13000, image: "/jordan-whitfield-Lprffwrv9cY-unsplash.jpg", category: "패션잡화" },
      { id: 7, name: "데님 자켓 & 니트 비니", desc: "라이트 워싱 데님 자켓과 포레스트 그린 리브드 비니.", price: 59000, image: "/images/85cb680b-b6bd-48bd-8ce4-9be2ce7ed365.jpg", category: "의류" },
      { id: 8, name: "미니멀 백팩", desc: "심플한 디자인의 다크 톤 백팩.", price: 49000, image: "/sun-lingyan-_H0fjILH5Vw-unsplash.jpg", category: "액세서리" },
      { id: 9, name: "기본 검정 티셔츠", desc: "무지 크루넥 반팔 티셔츠.", price: 19900, image: "/images/black-tshirt-main.png", category: "의류" },
    ],
    filtered: [],
    loading: false,
  }),

  getters: {
    allProducts: (state) => state.products,
    hasResults: (state) => state.filtered.length > 0,
  },

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

    async fetchProductsFromDB() {
      this.loading = true;
      try {
        const res = await api.get("/products");
        this.products = res.data;
      } catch (err) {
        console.error("❌ 상품 목록 불러오기 실패:", err);
      } finally {
        this.loading = false;
      }
    },
  },
});
