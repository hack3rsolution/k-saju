import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse, User } from './types';

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = process.env.API_BASE_URL || 'http://localhost:3001/api') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    const res = await this.client.get(`/users/${id}`);
    return res.data;
  }

  async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const res = await this.client.request(config);
    return res.data;
  }
}

export const apiClient = new ApiClient();
