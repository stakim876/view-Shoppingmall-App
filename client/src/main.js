import { createApp } from "vue";
import { createPinia, setActivePinia } from "pinia";
import App from "@/app/App.vue";
import router from "./router";
import { useToastStore } from "./store/toast";
import "./assets/main.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
setActivePinia(pinia);

app.config.errorHandler = (err, _instance, info) => {
  console.error("[Vue]", info, err);
  try {
    useToastStore().error(
      "화면 처리 중 문제가 생겼어요. 새로고침 후 다시 시도해 주세요."
    );
  } catch (_) {
  }
};

window.addEventListener("unhandledrejection", (event) => {
  console.error("[unhandledrejection]", event.reason);
  try {
    useToastStore().error(
      "요청 처리 중 오류가 났어요. 잠시 후 다시 시도해 주세요."
    );
  } catch (_) {
  }
});

router.onError((err) => {
  console.error("[router]", err);
  try {
    useToastStore().error(
      "페이지를 불러오지 못했어요. 네트워크 확인 후 다시 시도해 주세요."
    );
  } catch (_) {
  }
});

app.use(router);
app.mount("#app");
