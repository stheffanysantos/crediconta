import { createApp } from 'vue';
import App from './App.vue';
import axios from 'axios';

// Configuração do Axios
axios.defaults.baseURL = 'http://localhost:5000'; // Substitua pela URL do seu backend

const app = createApp(App);
app.config.globalProperties.$axios = axios; // Torna o Axios disponível globalmente
app.mount('#app');