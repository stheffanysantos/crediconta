<template>
  <div id="app">
    <h1>Bem-vindo ao Crediconta</h1>
    <p>Este é o frontend do projeto.</p>
    <UploadCSV />
    <ReportsPage /> 
    <LoginUser/>  
  </div>
</template>

<script>
import UploadCSV from './components/UploadCSV'; // Importa o componente de upload
import ReportsPage from './components/ReportsPage.vue'; // Importa o componente de relatórios
import LoginUser from './components/LoginUser.vue';

export default {
  name: 'App',
  components: {
    UploadCSV,
    ReportsPage,
    LoginUser
  }
};
</script>

<style>
#app {
  text-align: center;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
