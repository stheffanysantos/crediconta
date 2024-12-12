export const testAPI = async () => {
    try {
        const response = await this.$axios.get('/');
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Erro ao acessar a API:', error);
        throw error;
    }
};