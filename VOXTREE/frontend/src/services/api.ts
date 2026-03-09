import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  AuthTokens,
  LoginRequest,
  LoginResponse,
  ApiResponse,
  Quotation,
  QuotationFilters,
  QuotationListResponse,
  CreateQuotationData
} from '../types';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newTokens = await this.refreshAccessToken();
            this.processQueue(null, newTokens.accessToken);
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
    const response = await axios.post(`${baseURL}/auth/refresh`, {
      refreshToken: this.refreshToken,
    });

    const { data } = response.data;
    this.setTokens(data.accessToken, this.refreshToken);
    return data;
  }

  private loadTokensFromStorage() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      this.setTokens(accessToken, refreshToken);
    }
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<ApiResponse<LoginResponse['data']>>('/auth/login', credentials);
    const { data } = response.data;

    if (data) {
      this.setTokens(data.accessToken, data.refreshToken);
    }

    return response.data as LoginResponse;
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.client.post('/auth/logout', {
          refreshToken: this.refreshToken,
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearTokens();
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  // Quotation methods
  async getQuotations(filters: QuotationFilters): Promise<QuotationListResponse> {
    const response = await this.client.get<ApiResponse<QuotationListResponse>>('/quotations', { params: filters });
    return response.data.data as QuotationListResponse;
  }

  async createQuotation(data: CreateQuotationData): Promise<Quotation> {
    const response = await this.client.post<ApiResponse<Quotation>>('/quotations', data);
    return response.data.data as Quotation;
  }

  async updateQuotation(id: number, data: any): Promise<Quotation> {
    const response = await this.client.put<ApiResponse<Quotation>>(`/quotations/${id}`, data);
    return response.data.data as Quotation;
  }

  async deleteQuotation(id: number): Promise<void> {
    await this.client.delete<ApiResponse<void>>(`/quotations/${id}`);
  }

  async duplicateQuotation(id: number): Promise<Quotation> {
    const response = await this.client.post<ApiResponse<Quotation>>(`/quotations/${id}/duplicate`);
    return response.data.data as Quotation;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
