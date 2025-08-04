// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_BASE_URL}/api`, // change to your production URL later
});

export default api;
