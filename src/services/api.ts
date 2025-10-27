import axios from "axios";
import { supabase } from './supabase';

const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) {
  console.error('ERRO CRÍTICO: Variável de ambiente VITE_API_URL não definida no arquivo .env');
}
console.log("Frontend (local) configurado para usar a API em:", apiUrl);

const api = axios.create({
  baseURL: apiUrl,
});

api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;