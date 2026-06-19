<template>
  <div class="shop-admin-shell">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      <header class="mb-8">
        <p class="text-xs font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 mb-1">
          Admin
        </p>
        <h1 class="shop-page-title">운영 대시보드</h1>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          상품·주문·공지를 관리합니다. AI 큐레이터 사용량과 전환 지표도 함께 확인하세요.
        </p>
      </header>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
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
          <span class="text-2xl font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">{{
            adminKpi.lowStock
          }}</span>
        </div>
      </div>

      <section class="mb-8 rounded-2xl border border-indigo-200/70 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 md:p-5">
        <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 class="text-sm font-semibold text-indigo-900 dark:text-indigo-300">AI 큐레이터 (오늘)</h2>
            <p class="mt-1 text-xs text-slate-600 dark:text-slate-400">
              추천 요청 → 결과 노출 → 클릭 → 장바구니 전환을 집계합니다.
            </p>
          </div>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <div class="shop-admin-kpi">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">추천 요청</span>
            <span class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{{
              aiStats.todayRequests
            }}</span>
          </div>
          <div class="shop-admin-kpi">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">결과 노출</span>
            <span class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{{
              aiStats.todayImpressions
            }}</span>
          </div>
          <div class="shop-admin-kpi">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">상품 클릭</span>
            <span class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{{
              aiStats.todayClicks
            }}</span>
          </div>
          <div class="shop-admin-kpi">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">장바구니</span>
            <span class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{{
              aiStats.todayCartAdds
            }}</span>
          </div>
          <div class="shop-admin-kpi col-span-2 lg:col-span-1">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">클릭률 / 담기률</span>
            <span class="text-lg md:text-xl font-bold text-indigo-700 dark:text-indigo-400 tabular-nums">
              {{ aiStats.clickRate }}% · {{ aiStats.cartRate }}%
            </span>
          </div>
        </div>
        <div v-if="aiStats.topPrompts.length > 0" class="mt-4 pt-4 border-t border-indigo-200/60 dark:border-indigo-800/40">
          <p class="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">자주 쓰인 추천 문장</p>
          <ul class="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            <li v-for="item in aiStats.topPrompts" :key="item.prompt" class="flex justify-between gap-3">
              <span class="truncate">{{ item.prompt }}</span>
              <span class="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{{ item.count }}회</span>
            </li>
          </ul>
        </div>
      </section>

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

      <div v-show="activeTab === 'products'" class="space-y-6">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="s in productSections"
            :key="s.id"
            type="button"
            @click="productSection = s.id"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              productSection === s.id ? 'shop-btn-primary' : 'shop-btn-secondary',
            ]"
          >
            {{ s.label }}
          </button>
        </div>

        <section v-show="productSection === 'register'" class="shop-admin-card p-5 md:p-6">
          <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">상품 등록</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
            필수 항목을 채운 뒤 등록하면 고객 목록에 반영됩니다. 색상은 쉼표로 구분하고, 노트북·PC는 사양 필드를 선택 입력하세요.
          </p>
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
            <div class="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-3">
              <p class="text-xs font-semibold text-slate-600 dark:text-slate-300">색상 옵션 (선택)</p>
              <input
                v-model="newColorsText"
                placeholder="예: 실버, 스페이스 그레이, 미드나이트 (쉼표로 구분)"
                class="shop-admin-input"
              />
              <p class="text-xs font-semibold text-slate-600 dark:text-slate-300">노트북·PC 사양 (선택)</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input v-model="newLaptopSpecs.cpu" placeholder="CPU" class="shop-admin-input" />
                <input v-model="newLaptopSpecs.ram" placeholder="RAM (예: 16GB)" class="shop-admin-input" />
                <input v-model="newLaptopSpecs.storage" placeholder="저장장치 (예: 512GB SSD)" class="shop-admin-input" />
                <input v-model="newLaptopSpecs.display" placeholder="디스플레이" class="shop-admin-input" />
                <input v-model="newLaptopSpecs.gpu" placeholder="GPU" class="shop-admin-input sm:col-span-2" />
              </div>
            </div>
            <button type="submit" class="shop-btn-primary px-5 py-2.5 rounded-xl text-sm w-full sm:w-auto">
              등록하기
            </button>
          </form>
        </section>

        <section v-show="productSection === 'list'">
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
            <table class="shop-admin-table min-w-[880px]">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>색상</th>
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
                  <td class="text-left text-xs max-w-[8rem]">{{ colorSummary(p) }}</td>
                  <td class="tabular-nums">{{ formatPrice(p.price) }}원</td>
                  <td class="tabular-nums">
                    <span>{{ p.stock ?? "—" }}</span>
                    <span
                      v-if="stockStateText(p.stock)"
                      class="ml-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                      :class="stockStateClass(p.stock)"
                    >
                      {{ stockStateText(p.stock) }}
                    </span>
                  </td>
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
                <td class="text-indigo-800 dark:text-indigo-300 font-medium whitespace-nowrap">
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

      <div v-show="activeTab === 'customers'" class="space-y-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">고객 CRM</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">세그먼트·LTV·주문 이력을 확인하고 CSV로 내보낼 수 있습니다.</p>
          </div>
          <button type="button" class="shop-btn-secondary px-4 py-2 rounded-xl text-sm" @click="exportCustomers">
            CSV 내보내기
          </button>
        </div>

        <div v-if="crmSummary" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="shop-admin-kpi">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">전체 고객</span>
            <span class="text-2xl font-bold tabular-nums">{{ crmSummary.totalCustomers }}</span>
          </div>
          <div class="shop-admin-kpi">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">VIP</span>
            <span class="text-2xl font-bold tabular-nums text-indigo-700 dark:text-indigo-400">{{ crmSummary.vipCount }}</span>
          </div>
          <div class="shop-admin-kpi">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">평균 LTV</span>
            <span class="text-lg font-bold tabular-nums">{{ formatPrice(crmSummary.avgLtv) }}원</span>
          </div>
          <div class="shop-admin-kpi">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">휴면</span>
            <span class="text-2xl font-bold tabular-nums">{{ crmSummary.dormantCount }}</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in customerSegmentOptions"
            :key="opt.id"
            type="button"
            @click="selectCustomerSegment(opt.id)"
            :class="[
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              customerSegment === opt.id ? 'shop-btn-primary' : 'shop-btn-secondary',
            ]"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="flex flex-wrap items-end justify-between gap-3">
          <span v-if="!customersLoading" class="text-xs text-slate-500 dark:text-slate-400">
            총 {{ customerPagination.total }}명
          </span>
        </div>

        <div class="flex flex-wrap gap-2 max-w-xl">
          <input
            v-model="customerSearch"
            type="search"
            placeholder="이름 또는 이메일 검색"
            class="shop-admin-input flex-1 min-w-[200px]"
            @keyup.enter="fetchCustomers(1)"
          />
          <button type="button" class="shop-btn-primary px-4 py-2 rounded-xl text-sm" @click="fetchCustomers(1)">
            검색
          </button>
        </div>

        <div v-if="customersLoading" class="shop-admin-card p-6 space-y-3">
          <div
            v-for="n in 5"
            :key="'cs-' + n"
            class="h-14 rounded-xl bg-slate-200/70 dark:bg-slate-700/45 animate-pulse"
          />
        </div>
        <div v-else-if="!customers.length" class="shop-admin-card p-12 text-center">
          <p class="text-slate-600 dark:text-slate-400">등록된 고객이 없습니다.</p>
        </div>
        <div v-else class="shop-admin-table-wrap overflow-x-auto rounded-2xl">
          <table class="shop-admin-table min-w-[920px]">
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>이메일</th>
                <th>세그먼트</th>
                <th>가입일</th>
                <th>주문</th>
                <th>누적 구매</th>
                <th>최근 주문</th>
                <th class="text-center">상세</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in customers" :key="c.id">
                <td class="tabular-nums">{{ c.id }}</td>
                <td class="font-medium">{{ c.name || "—" }}</td>
                <td class="text-left text-sm">{{ c.email }}</td>
                <td>
                  <span class="inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold" :class="segmentClass(c.segment)">
                    {{ segmentLabel(c.segment) }}
                  </span>
                </td>
                <td class="text-xs whitespace-nowrap">{{ formatDate(c.created_at) }}</td>
                <td class="tabular-nums">{{ c.order_count || 0 }}건</td>
                <td class="tabular-nums whitespace-nowrap">{{ formatPrice(c.total_spent) }}원</td>
                <td class="text-xs whitespace-nowrap">{{ c.last_order_at ? formatDate(c.last_order_at) : "—" }}</td>
                <td class="text-center">
                  <button type="button" class="shop-link-muted text-xs" @click="openCustomerDetail(c.id)">보기</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="selectedCustomer"
      class="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/50 dark:bg-black/70 p-4"
      @click.self="selectedCustomer = null"
    >
      <div class="flex min-h-[100dvh] min-h-screen items-center justify-center py-8">
        <div class="shop-admin-card w-full max-w-2xl p-6 bg-white dark:bg-slate-900 my-auto">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {{ selectedCustomer.user?.name || "고객" }} 상세
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ selectedCustomer.user?.email }}</p>
            </div>
            <button type="button" class="shop-btn-secondary px-3 py-1.5 rounded-lg text-xs" @click="selectedCustomer = null">
              닫기
            </button>
          </div>
          <div class="grid grid-cols-3 gap-3 mb-5">
            <div class="shop-admin-kpi">
              <span class="text-xs text-slate-500">주문</span>
              <span class="text-xl font-bold tabular-nums">{{ selectedCustomer.stats?.order_count || 0 }}건</span>
            </div>
            <div class="shop-admin-kpi">
              <span class="text-xs text-slate-500">누적 구매</span>
              <span class="text-lg font-bold tabular-nums">{{ formatPrice(selectedCustomer.stats?.total_spent) }}원</span>
            </div>
            <div class="shop-admin-kpi">
              <span class="text-xs text-slate-500">가입일</span>
              <span class="text-sm font-semibold">{{ formatDate(selectedCustomer.user?.created_at) }}</span>
            </div>
          </div>
          <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">최근 주문</h4>
          <div v-if="!selectedCustomer.orders?.length" class="text-sm text-slate-500 py-4 text-center">
            주문 내역이 없습니다.
          </div>
          <ul v-else class="space-y-2 max-h-72 overflow-y-auto">
            <li
              v-for="o in selectedCustomer.orders"
              :key="o.id"
              class="rounded-xl border border-slate-200/80 dark:border-white/[0.08] px-3 py-2 text-sm"
            >
              <div class="flex justify-between gap-3">
                <span class="font-medium">#{{ o.id }}</span>
                <span class="tabular-nums">{{ formatPrice(o.total_price) }}원</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ o.products || "—" }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(o.created_at) }} · {{ getStatusLabel(o.status) }}</p>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div
      v-if="editingProduct"
      class="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/50 dark:bg-black/70 p-4"
      @click.self="editingProduct = null"
    >
      <div class="flex min-h-[100dvh] min-h-screen items-center justify-center py-8">
      <div
        class="shop-admin-card w-full max-w-xl p-6 bg-white dark:bg-slate-900 my-auto"
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
          <div class="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-3">
            <p class="text-xs font-semibold text-slate-600 dark:text-slate-300">색상 옵션 (선택)</p>
            <input
              v-model="editColorsText"
              placeholder="예: 실버, 스페이스 그레이 (쉼표로 구분)"
              class="shop-admin-input"
            />
            <p class="text-xs font-semibold text-slate-600 dark:text-slate-300">노트북·PC 사양 (선택)</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input v-model="editLaptopSpecs.cpu" placeholder="CPU" class="shop-admin-input" />
              <input v-model="editLaptopSpecs.ram" placeholder="RAM" class="shop-admin-input" />
              <input v-model="editLaptopSpecs.storage" placeholder="저장장치" class="shop-admin-input" />
              <input v-model="editLaptopSpecs.display" placeholder="디스플레이" class="shop-admin-input" />
              <input v-model="editLaptopSpecs.gpu" placeholder="GPU" class="shop-admin-input sm:col-span-2" />
            </div>
          </div>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import api from "../../lib/api";
import { useToastStore } from "../../store/toast";
import { formatPrice } from "../../lib/format";

const toast = useToastStore();
const aiStats = ref({
  todayRequests: 0,
  todayImpressions: 0,
  todayClicks: 0,
  todayCartAdds: 0,
  clickRate: 0,
  cartRate: 0,
  topPrompts: [],
});
const activeTab = ref("products");
const productSection = ref("register");
const productSections = [
  { id: "register", label: "상품 등록" },
  { id: "list", label: "목록 · 삭제 · 수정" },
];
const tabItems = [
  { id: "products", label: "상품 관리" },
  { id: "orders", label: "주문 관리" },
  { id: "customers", label: "고객 관리" },
  { id: "notices", label: "공지사항" },
];

const emptyLaptopSpecs = () => ({
  cpu: "",
  ram: "",
  storage: "",
  display: "",
  gpu: "",
});

const newColorsText = ref("");
const editColorsText = ref("");
const newLaptopSpecs = reactive(emptyLaptopSpecs());
const editLaptopSpecs = reactive(emptyLaptopSpecs());

function colorsToPayload(text) {
  const t = String(text || "").trim();
  if (!t) return null;
  const arr = t.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

function colorsFromRow(val) {
  if (val == null || val === "") return "";
  try {
    const p = typeof val === "string" ? JSON.parse(val) : val;
    return Array.isArray(p) ? p.join(", ") : "";
  } catch {
    return "";
  }
}

function specsToPayload(spec) {
  const o = {};
  for (const [k, v] of Object.entries(spec)) {
    const s = String(v || "").trim();
    if (s) o[k] = s;
  }
  return Object.keys(o).length ? JSON.stringify(o) : null;
}

function specsFromRow(val) {
  const empty = emptyLaptopSpecs();
  if (val == null || val === "") return empty;
  try {
    const p = typeof val === "string" ? JSON.parse(val) : val;
    return { ...empty, ...p };
  } catch {
    return empty;
  }
}

function colorSummary(p) {
  const raw = p?.color_options;
  if (raw == null || raw === "") return "—";
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr) || !arr.length) return "—";
    const head = arr.slice(0, 2).join(" · ");
    return arr.length > 2 ? `${head}…` : head;
  } catch {
    return "—";
  }
}

function stockStateText(stock) {
  const n = Number(stock);
  if (!Number.isFinite(n)) return "";
  if (n <= 0) return "품절";
  if (n <= 5) return "주의";
  return "";
}

function stockStateClass(stock) {
  const n = Number(stock);
  if (!Number.isFinite(n)) return "";
  if (n <= 0) return "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300";
  if (n <= 5) return "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300";
  return "";
}

const products = ref([]);
const orders = ref([]);
const carriers = ref([]);
const trackingDraft = reactive({});
const productsLoading = ref(true);
const ordersLoading = ref(true);
const customers = ref([]);
const customersLoading = ref(false);
const customerSearch = ref("");
const customerSegment = ref("");
const crmSummary = ref(null);
const customerSegmentOptions = [
  { id: "", label: "전체" },
  { id: "vip", label: "VIP" },
  { id: "active", label: "활성" },
  { id: "new", label: "신규" },
  { id: "dormant", label: "휴면" },
  { id: "regular", label: "일반" },
];
const customerPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 1 });
const selectedCustomer = ref(null);

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
  if (id === "customers") {
    fetchCrmSummary();
    fetchCustomers(1);
  }
}

const segmentLabel = (segment) => {
  const map = { vip: "VIP", active: "활성", new: "신규", dormant: "휴면", regular: "일반" };
  return map[segment] || segment || "—";
};

const segmentClass = (segment) => {
  const map = {
    vip: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200",
    new: "bg-sky-100 text-sky-800 dark:bg-sky-900/35 dark:text-sky-200",
    dormant: "bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-200",
    regular: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return map[segment] || map.regular;
};

const fetchCrmSummary = async () => {
  try {
    const res = await api.get("/admin/crm/summary");
    crmSummary.value = res.data?.summary || null;
  } catch (_) {
    crmSummary.value = null;
  }
};

const selectCustomerSegment = (segment) => {
  customerSegment.value = segment;
  fetchCustomers(1);
};

const exportCustomers = async () => {
  try {
    const res = await api.get("/admin/users/export", {
      params: {
        search: customerSearch.value.trim() || undefined,
        segment: customerSegment.value || undefined,
      },
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("고객 CSV를 내려받았습니다.");
  } catch (err) {
    toast.error(err.response?.data?.message || err.userMessage || "CSV 내보내기에 실패했습니다.");
  }
};

const fetchCustomers = async (page = customerPagination.value.page) => {
  customersLoading.value = true;
  try {
    const res = await api.get("/admin/users", {
      params: {
        page,
        limit: customerPagination.value.limit,
        search: customerSearch.value.trim() || undefined,
        segment: customerSegment.value || undefined,
      },
    });
    customers.value = Array.isArray(res.data?.users) ? res.data.users : [];
    customerPagination.value = {
      ...customerPagination.value,
      ...(res.data?.pagination || {}),
      page,
    };
  } catch (err) {
    customers.value = [];
    toast.error(err.response?.data?.message || err.userMessage || "고객 목록을 불러오지 못했습니다.");
  } finally {
    customersLoading.value = false;
  }
};

const openCustomerDetail = async (id) => {
  try {
    const res = await api.get(`/admin/users/${id}`);
    if (res.data?.success) {
      selectedCustomer.value = {
        user: res.data.user,
        stats: res.data.stats,
        orders: res.data.orders || [],
      };
    }
  } catch (err) {
    toast.error(err.response?.data?.message || err.userMessage || "고객 상세를 불러오지 못했습니다.");
  }
};

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
    await api.post("/products/add", {
      ...newProduct.value,
      color_options: colorsToPayload(newColorsText.value),
      laptop_specs: specsToPayload(newLaptopSpecs),
    });
    toast.success("상품이 등록되었습니다!");
    fetchProducts();
    newProduct.value = { name: "", description: "", price: "", image_url: "", category: "", stock: "" };
    newColorsText.value = "";
    Object.assign(newLaptopSpecs, emptyLaptopSpecs());
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
  editColorsText.value = colorsFromRow(p.color_options);
  Object.assign(editLaptopSpecs, specsFromRow(p.laptop_specs));
};

const updateProduct = async () => {
  if (!editingProduct.value) return;
  try {
    await api.put(`/products/${editingProduct.value.id}`, {
      ...editForm.value,
      color_options: colorsToPayload(editColorsText.value),
      laptop_specs: specsToPayload(editLaptopSpecs),
    });
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

const fetchAiStats = async () => {
  try {
    const res = await api.get("/admin/analytics/ai-recommend-stats");
    const data = res.data || {};
    aiStats.value = {
      todayRequests: Number(data.todayRequests) || 0,
      todayImpressions: Number(data.todayImpressions) || 0,
      todayClicks: Number(data.todayClicks) || 0,
      todayCartAdds: Number(data.todayCartAdds) || 0,
      clickRate: Number(data.clickRate) || 0,
      cartRate: Number(data.cartRate) || 0,
      topPrompts: Array.isArray(data.topPrompts) ? data.topPrompts : [],
    };
  } catch (_) {
    aiStats.value = {
      todayRequests: 0,
      todayImpressions: 0,
      todayClicks: 0,
      todayCartAdds: 0,
      clickRate: 0,
      cartRate: 0,
      topPrompts: [],
    };
  }
};

onMounted(async () => {
  await fetchCarriers();
  await Promise.all([fetchProducts(), fetchOrders(), fetchNotices(), fetchAiStats()]);
});
</script>
