<template>
  <div>
    <h2>Login</h2>
    <form @submit.prevent="login">
      <input type="text" v-model="username" placeholder="Usuário ou Email" required />
      <input type="password" v-model="password" placeholder="Senha" required />
      <button type="submit">Entrar</button>
    </form>
    <p v-if="message">{{ message }}</p> 
  </div>
</template>

<script>
import { loginUser } from '../services/auth';

export default {
  data() {
    return {
      username: '', 
      password: '',  
      message: '',  
    };
  },
  methods: {
    async login() {
      try {
        const token = await loginUser(this.username, this.password);
        localStorage.setItem('token', token); 
        this.message = 'Login bem-sucedido!';
        this.$router.push('/dashboardMenu');  
      } catch (error) {
        this.message = error.message;  
      }
    },
  },
};
</script>
