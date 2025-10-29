import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/LoginForm.vue'
import SignUpForm from '../components/SignUpForm.vue'
import HomePage from '../components/HomePage.vue'          
import CheckoutPage from '../components/CheckoutPage.vue'
import OrderComplete from '../components/OrderComplete.vue' 
import CartPage from '../components/CartPage.vue'
import ProductList from '../components/ProductList.vue'
import MyPage from '../components/MyPage.vue' 


const routes = [
  { path: '/', component: LoginForm },
  { path: '/login', component: LoginForm},
  { path: '/signup', component: SignUpForm },
  { path: '/home', component: HomePage },
  { path: '/products', component: ProductList }, 
  { path: '/checkout', component: CheckoutPage },
  { path: '/order-complete', component: OrderComplete },
  { path: '/cart', component: CartPage },
  { path: '/mypage', component: MyPage } 
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
