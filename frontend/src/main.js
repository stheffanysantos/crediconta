import { createApp } from 'vue';    
import App from './App.vue';         
import axios from 'axios';         
import router from './router';    



axios.defaults.baseURL = 'http://localhost:5000'; 

const app = createApp(App);

app.config.globalProperties.$axios = axios;

// Usa o Vue Router (para navegação entre as páginas)
app.use(router);

app.mount('#app');
