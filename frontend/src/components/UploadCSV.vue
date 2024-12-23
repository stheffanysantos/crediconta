<template>
    <div>
      <h2>Upload de CSV</h2>
      <input type="file" @change="uploadFile" />
      <p v-if="message">{{ message }}</p> <!-- Exibe mensagem após o upload -->
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        message: '', 
      };
    },
    methods: {
      async uploadFile(event) {
        const file = event.target.files[0]; 
        const formData = new FormData(); 
        formData.append('file', file); 
  
        try {
          const response = await axios.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data', 
            },
          });
          this.message = response.data.message; 
        } catch (error) {
          this.message = 'Erro ao enviar o arquivo.'; 
        }
      },
    },
  };
  </script>
  