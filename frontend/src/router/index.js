import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/LoginUser.vue';


const routes = [
  { path: '/login', component: Login },
  { path: '/dashboard', component: () => import('../components/DashboardMenu.vue') }, // Substitua com seu componente
];

const router = createRouter({
    history: createWebHistory(), // Alterado para Vue 3
    routes,
  });

export default router;
