import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Jsx from "@vitejs/plugin-vue-jsx";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), Jsx()],
  test: {
    globals: true,
    environment: "happy-dom",
  },
});
