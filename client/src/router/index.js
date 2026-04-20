import { createRouter, createWebHistory } from "vue-router";

import LoginForm from "@/views/auth/LoginForm.vue";
import SignUpForm from "@/views/auth/SignUpForm.vue";
import HomePage from "@/views/home/HomePage.vue";
import CartPage from "@/views/order/CartPage.vue";
import CheckoutPage from "@/views/order/CheckoutPage.vue";
import OrderComplete from "@/views/order/OrderComplete.vue";
import OrderDetail from "@/views/order/OrderDetail.vue";
import ProductList from "@/views/shop/ProductList.vue";
import ProductDetail from "@/views/shop/ProductDetail.vue";
import MyPage from "@/views/auth/MyPage.vue";
import AdminPage from "@/views/admin/AdminPage.vue";
import AdminSignup from "@/views/admin/AdminSignup.vue";
import NoticePage from "@/views/notice/NoticePage.vue";
import OrderLookup from "@/views/order/OrderLookup.vue";
import WishlistPage from "@/views/shop/WishlistPage.vue";
import NotFound from "@/components/ui/NotFound.vue";
import { getAuthState } from "@/lib/authStorage.js";

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

router.beforeEach((to, from, next) => {
  const { token, user } = getAuthState();
  const isLoggedIn = !!(token && user);
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: "/login", query: { redirect: to.fullPath } });
    return;
  }

  if (to.meta.requiresAdmin && user?.role !== "admin") {
    next({ path: "/home" });
    return;
  }

  next();
});

export default router;
