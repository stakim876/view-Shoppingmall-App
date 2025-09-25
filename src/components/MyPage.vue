<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">마이페이지</h1>

    <h2 class="text-xl font-semibold mb-2">주문 내역</h2>

    <div v-if="orders.length === 0" class="text-gray-500">
      주문 내역이 없습니다.
    </div>

    <div v-else>
      <div 
        v-for="(order, index) in groupedOrders" 
        :key="index" 
        class="border rounded p-4 mb-4 bg-white shadow"
      >
        <p class="font-bold">주문번호: {{ order.order_id }}</p>
        <p class="text-sm text-gray-500">
          주문일자: {{ formatDate(order.created_at) }}
        </p>

        <ul class="mt-2">
          <li 
            v-for="item in order.items" 
            :key="item.product_name" 
            class="flex justify-between border-b py-1"
          >
            <span>{{ item.product_name }} (x{{ item.quantity }})</span>
            <span>{{ (item.price * item.quantity).toLocaleString() }}원</span>
          </li>
        </ul>

        <p class="mt-2 font-bold text-right">
          총액: {{ order.total_price.toLocaleString() }}원
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const userId = 1
const orders = ref([])

const fetchOrders = async () => {
  try {
    const res = await axios.get(`http://localhost:3001/api/orders/${userId}`)
    orders.value = res.data
  } catch (err) {
    console.error('❌ 주문 내역 불러오기 실패:', err)
  }
}

onMounted(fetchOrders)

const groupedOrders = computed(() => {
  const map = {}
  orders.value.forEach(order => {
    if (!map[order.order_id]) {
      map[order.order_id] = {
        order_id: order.order_id,
        created_at: order.created_at,
        total_price: order.total_price,
        items: []
      }
    }
    map[order.order_id].items.push({
      product_name: order.product_name,
      quantity: order.quantity,
      price: order.price
    })
  })
  return Object.values(map)
})

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleString()
}
</script>

<style>
body {
  background-color: #f9fafb;
}
</style>
