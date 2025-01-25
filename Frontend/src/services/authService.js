import axios from "axios";

const API_URL = process.env.REACT_APP_PUBLIC_URL;

const register = async (userData) => {
  const response = await axios.post(`${API_URL}/signup`, userData);
  if (response.data) {
    localStorage.setItem("token", response.data.token);
  }
  return response;
};

const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  if (response.data) {
    localStorage.setItem("token", response.data.token);
  }
  return response;
};

const logout = () => {
  localStorage.removeItem("token");
};

const getUser = async () => {
  const token = localStorage.getItem("token");
  if (token) {
    const response = await axios.get(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
  return null;
};

const authService = {
  register,
  login,
  logout,
  getUser,
};

export default authService;
