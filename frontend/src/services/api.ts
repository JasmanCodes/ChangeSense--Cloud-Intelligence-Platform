const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('cs_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...(options.headers || {}),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError: any) {
      console.warn(`[API] Network error connecting to ${endpoint}:`, networkError.message);
      throw new Error(`Unable to connect to backend server at ${API_BASE_URL}. Please ensure backend is running.`);
    }

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
      // Clear invalid token gracefully
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_user');
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Invalid response format from server (${response.status})`);
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.error?.message || data.message || `API Error: ${response.status}`);
    }

    return data.data !== undefined ? data.data : data;
  }

  // Auth methods
  async signup(payload: { name: string; companyName: string; email: string; password?: string }) {
    return this.request<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async login(payload: { email: string; password?: string }) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async logout() {
    return this.request<any>('/auth/logout', { method: 'POST' });
  }

  // Org methods
  async getOrg() {
    return this.request<any>('/org');
  }

  async updateOrg(payload: { name?: string; industry?: string; teamSize?: string }) {
    return this.request<any>('/org', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getServices() {
    return this.request<Record<string, boolean>>('/org/services');
  }

  async toggleService(serviceKey: string, enabled: boolean) {
    return this.request<any>('/org/services/toggle', {
      method: 'POST',
      body: JSON.stringify({ serviceKey, enabled }),
    });
  }

  async getTeam() {
    return this.request<any[]>('/org/team');
  }

  // Dashboard & Demo methods (Phase 3)
  async getDashboardSummary(params?: { env?: string; timeRange?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<any>(`/dashboard/summary${qs ? `?${qs}` : ''}`);
  }

  async getTimeline(params?: { type?: string; service?: string; env?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/timeline${qs ? `?${qs}` : ''}`);
  }

  async getChanges(params?: { service?: string; limit?: number }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/changes${qs ? `?${qs}` : ''}`);
  }

  async getChangeDetail(id: string) {
    return this.request<any>(`/changes/${id}`);
  }

  async seedDemoData() {
    return this.request<any>('/demo/seed', { method: 'POST' });
  }

  async simulateDeployment(payload?: { serviceName?: string; version?: string }) {
    return this.request<any>('/demo/simulate-deployment', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  }

  // Incident methods (Phase 4)
  async getIncidents(params?: { status?: string; severity?: string; service?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/incidents${qs ? `?${qs}` : ''}`);
  }

  async getIncidentDetail(id: string) {
    return this.request<any>(`/incidents/${id}`);
  }

  async updateIncidentStatus(id: string, status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED') {
    return this.request<any>(`/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async acknowledgeIncident(id: string) {
    return this.request<any>(`/incidents/${id}/acknowledge`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
