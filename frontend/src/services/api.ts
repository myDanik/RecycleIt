const API_URL = "http://localhost:8080/api";

const api = {
  async request(endpoint: string, options: RequestInit = {}, retry: boolean = true): Promise<any> {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem("access_token");
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const config = { ...options, headers };
    try {
      const response = await fetch(url, config);

      if (response.status === 403) {
        throw { status: 403, message: "Недостаточно прав доступа" };
      }

      if (response.status === 401 && retry) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request(endpoint, options, false);
        }
        window.location.href = "/sidebar/login";
        throw { status: 401, message: "Сессия истекла" };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.detail || `Ошибка: ${response.status}`,
        };
      }
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  async register(userData: object) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async login(credentials: object) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token)
    localStorage.setItem("user", JSON.stringify({
      id: data.id,
      username: data.username,
      role: data.role,
    }));

    return data;
  },

    logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/sidebar/login";
  },

  async refreshAccessToken(): Promise<boolean> {
  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });

    if (!response.ok) {
      this.logout();
      return false;
    }

    const data = await response.json();
    localStorage.setItem("access_token", data.access_token);
    return true;
  } catch {
    this.logout();
    return false;
  }
},

  getCurrentUser() {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  },

  async getUsers() {
    return this.request("/users/");
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === "admin";
  },

  async getPoints(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    if (filters.q) params.append("q", filters.q);
    if (filters.waste_type) params.append("waste_type", filters.waste_type);
    if (filters.open_now) params.append("open_now", filters.open_now);
    if (filters.skip) params.append("skip", filters.skip);
    if (filters.limit) params.append("limit", filters.limit);
    const query = params.toString();
    return this.request(query ? `/points/?${query}` : "/points/");
  },

  async getPointById(id: number) {
    return this.request(`/points/${id}`);
  },

  async createPoint(pointData: object) {
    return this.request("/points/", {
      method: "POST",
      body: JSON.stringify(pointData),
    });
  },

  async updatePoint(id: number, pointData: object) {
    return this.request(`/points/${id}`, {
      method: "PUT",
      body: JSON.stringify(pointData),
    });
  },

  async deletePoint(id: number) {
    return this.request(`/points/${id}`, { method: "DELETE" });
  },

  async uploadPointPhoto(pointId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = this.request(`/points/${pointId}/photo`, {
    method: "POST",
    body: form,
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
    });
    return response;
  },

  async deletePointPhoto(pointId: number) {
    return this.request(`/points/${pointId}/photo`, { method: "DELETE" });
  },

  async getFeedback(pointId: number | null = null) {
    const params = new URLSearchParams();
    if (pointId) params.append("point_id", String(pointId));
    const query = params.toString();
    return this.request(query ? `/feedback/?${query}` : "/feedback/");
  },

  async createFeedback(feedbackData: object) {
    return this.request("/feedback/", {
      method: "POST",
      body: JSON.stringify(feedbackData),
    });
  },

  async getFeedbackById(id: number) {
    return this.request(`/feedback/${id}`);
  },

  async deleteFeedback(id: number) {
    return this.request(`/feedback/${id}`, { method: "DELETE" });
  },


  async changeUserRole(userId: number, role: "user" | "admin") {
    return this.request(`/users/${userId}/role?role=${role}`, {
      method: "PUT",
    });
  },

  async deleteUser(userId: number) {
    return this.request(`/users/${userId}`, { method: "DELETE" });
  },

  async healthCheck() {
    return this.request("/health");
  },
};

export default api;