import axios from 'axios';
import { API_BASE_URL } from '@/constants/theme';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status >= 500) {
      console.error('Erro no servidor:', error.response?.data);
    } else if (!error.response) {
      console.error('Sem conexão com o servidor:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
