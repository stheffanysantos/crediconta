<template>
    <div>
      <h2>Relatórios</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in reports" :key="report.id">
            <td>{{ report.id }}</td>
            <td>{{ report.cliente }}</td>
            <td>{{ report.valor }}</td>
            <td>{{ report.data }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        reports: [], 
      };
    },
    async created() {
      try {
        const response = await axios.get('/api/reports'); 
        this.reports = response.data; 
      } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
      }
    },
  };
  </script>
  