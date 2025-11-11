import axios from 'axios';

const PRODUCT_API = process.env.REACT_APP_PRODUCT_SERVICE || 'http://localhost:3001';
const ORDER_API = process.env.REACT_APP_ORDER_SERVICE || 'http://localhost:3002';
const USER_API = process.env.REACT_APP_USER_SERVICE || 'http://localhost:3003';

// Create axios instances with interceptors
const productAPI = axios.create({ baseURL: PRODUCT_API });
const orderAPI = axios.create({ baseURL: ORDER_API });
const userAPI = axios.create({ baseURL: USER_API });

// Add error handling interceptor
const errorHandler = (error) => {
  console.error('API Error:', error);
  return Promise.reject(error);
};

productAPI.interceptors.response.use(response => response, errorHandler);
orderAPI.interceptors.response.use(response => response, errorHandler);
userAPI.interceptors.response.use(response => response, errorHandler);

// Product API
export const getProducts = () => productAPI.get('/api/products');
export const getProduct = (id) => productAPI.get(`/api/products/${id}`);
export const createProduct = (data) => productAPI.post('/api/products', data);
export const updateProduct = (id, data) => productAPI.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => productAPI.delete(`/api/products/${id}`);

// Order API
export const getOrders = () => orderAPI.get('/api/orders');
export const getOrder = (id) => orderAPI.get(`/api/orders/${id}`);
export const createOrder = (data) => orderAPI.post('/api/orders', data);
export const updateOrder = (id, data) => orderAPI.put(`/api/orders/${id}`, data);

// User API
export const getUsers = () => userAPI.get('/api/users');
export const getUser = (id) => userAPI.get(`/api/users/${id}`);
export const createUser = (data) => userAPI.post('/api/users', data);
export const updateUser = (id, data) => userAPI.put(`/api/users/${id}`, data);
export const deleteUser = (id) => userAPI.delete(`/api/users/${id}`);

// Health checks
export const checkHealth = async () => {
  try {
    const [product, order, user] = await Promise.all([
      axios.get(`${PRODUCT_API}/health`),
      axios.get(`${ORDER_API}/health`),
      axios.get(`${USER_API}/health`)
    ]);
    return {
      product: product.data,
      order: order.data,
      user: user.data
    };
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};