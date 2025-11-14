import { createRouter, createWebHistory } from "vue-router";

import LoginForm from "@/components/LoginForm.vue";
import SignUpForm from "@/components/SignUpForm.vue";
import HomePage from "@/components/HomePage.vue";
import CartPage from "@/components/CartPage.vue";
import CheckoutPage from "@/components/CheckoutPage.vue";
import OrderComplete from "@/components/OrderComplete.vue";
import OrderDetail from "@/components/OrderDetail.vue";
import ProductList from "@/components/ProductList.vue";
import ProductDetail from "@/components/ProductDetail.vue";
import MyPage from "@/components/MyPage.vue";
import AdminPage from "@/components/AdminPage.vue";

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/login", component: LoginForm },
  { path: "/signup", component: SignUpForm },
  { path: "/home", component: HomePage },
  { path: "/products", component: ProductList },
  { path: "/product/:id", component: ProductDetail, props: true },
  { path: "/cart", component: CartPage },
  { path: "/checkout", component: CheckoutPage },
  { path: "/order-complete", component: OrderComplete },
  { path: "/order/:id", component: OrderDetail },
  { path: "/mypage", component: MyPage },
  { path: "/admin", component: AdminPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
