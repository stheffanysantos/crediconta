import axios from 'axios';

// Define a URL base para o backend
axios.defaults.baseURL = 'http://localhost:5000'; // Substitua pelo URL do seu servidor backend

// Função para realizar o login
export async function loginUser(username, password) {
  try {
    // Envia uma requisição POST para o backend com as credenciais
    const response = await axios.post('/api/login', { username, password });
    
    // Retorna o token JWT enviado pelo backend
    return response.data.token;
  } catch (error) {
    // Lança um erro caso a requisição falhe
    throw new Error('Credenciais inválidas. Tente novamente.');
  }
}
