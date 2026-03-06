import { createRouter, createWebHistory } from "vue-router";

import LoginForm from "@/components/auth/LoginForm.vue";
import SignUpForm from "@/components/auth/SignUpForm.vue";
import HomePage from "@/components/layout/HomePage.vue";
import CartPage from "@/components/order/CartPage.vue";
import CheckoutPage from "@/components/order/CheckoutPage.vue";
import OrderComplete from "@/components/order/OrderComplete.vue";
import OrderDetail from "@/components/product/OrderDetail.vue";
import ProductList from "@/components/product/ProductList.vue";
import ProductDetail from "@/components/product/ProductDetail.vue";
import MyPage from "@/components/auth/MyPage.vue";
import AdminPage from "@/components/admin/AdminPage.vue";
import AdminSignup from "@/components/admin/AdminSignup.vue";
import NoticePage from "@/components/notice/NoticePage.vue";
import OrderLookup from "@/components/order/OrderLookup.vue";
import WishlistPage from "@/components/product/WishlistPage.vue";
import NotFound from "@/components/common/NotFound.vue";

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/login", component: LoginForm },
  { path: "/signup", component: SignUpForm },
  { path: "/admin-signup", component: AdminSignup },
  { path: "/home", component: HomePage },
  { path: "/products", component: ProductList },
  { path: "/product/:id", component: ProductDetail, props: true },
  { path: "/cart", component: CartPage },
  { path: "/wishlist", component: WishlistPage },
  { 
    path: "/checkout", 
    component: CheckoutPage,
    meta: { requiresAuth: true }
  },
  { path: "/order-complete", component: OrderComplete },
  { path: "/order-lookup", component: OrderLookup },
  { path: "/notice", component: NoticePage },
  { 
    path: "/order/:id", 
    component: OrderDetail,
    meta: { requiresAuth: true }
  },
  { 
    path: "/mypage", 
    component: MyPage,
    meta: { requiresAuth: true }
  },
  { 
    path: "/admin", 
    component: AdminPage,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { path: "/:pathMatch(.*)*", component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 라우터 가드 - 인증 및 권한 체크
router.beforeEach((to, from, next) => {
  // localStorage에서 인증 정보 확인
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isLoggedIn = !!(token && user);
  
  // 인증이 필요한 페이지 체크
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: "/login", query: { redirect: to.fullPath } });
    return;
  }

  // 관리자 권한이 필요한 페이지 체크
  if (to.meta.requiresAdmin && user?.role !== "admin") {
    next({ path: "/home" });
    return;
  }

  next();
});

export default router;
