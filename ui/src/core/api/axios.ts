import axios from 'axios'

const instanceAxios = axios.create({
    baseURL: '/',
    headers: { 'Content-Type': 'application/json' }
})

instanceAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    }
)

instanceAxios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) localStorage.removeItem('token');
    return Promise.reject(err);
  }
);

export { instanceAxios }
