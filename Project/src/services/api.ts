import {
  User, LogFile, LogEntry, Anomaly, Investigation, AuditLog,
  SystemSettings, DashboardMetrics, SuspiciousIp, AIReportData
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('cyber_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An unexpected server error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || data.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(data: { name: string; email: string; password: string; role: string; department?: string }): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
    } catch {
      // ignore
    }
  },

  async forgotPassword(email: string): Promise<{ message: string; demoResetToken?: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async resetPassword(email: string, newPassword: string, resetToken?: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword, resetToken })
    });
    return handleResponse(res);
  },

  // Logs
  async uploadLog(file: File): Promise<{ logFile: LogFile; totalEntries: number; anomaliesDetected: number; formatDetected: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/logs/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData
    });
    return handleResponse(res);
  },

  async uploadLogContent(content: string, filename: string): Promise<{ logFile: LogFile; totalEntries: number; anomaliesDetected: number; formatDetected: string }> {
    const res = await fetch(`${API_BASE}/logs/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ content, filename })
    });
    return handleResponse(res);
  },

  async loadSampleLog(sampleType: 'sqli_attack' | 'ssh_bruteforce' | 'cloud_json' | 'microservice_500'): Promise<{ logFile: LogFile; totalEntries: number; anomaliesDetected: number }> {
    const res = await fetch(`${API_BASE}/logs/sample`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ sampleType })
    });
    return handleResponse(res);
  },

  async getLogFiles(): Promise<{ logFiles: LogFile[] }> {
    const res = await fetch(`${API_BASE}/logs`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getLogFileDetails(id: string): Promise<{ logFile: LogFile; entries: LogEntry[]; anomalies: Anomaly[] }> {
    const res = await fetch(`${API_BASE}/logs/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async deleteLogFile(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/logs/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Anomalies
  async getAnomalies(params?: { severity?: string; type?: string; status?: string; ip?: string; search?: string }): Promise<{ anomalies: Anomaly[] }> {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.ip) query.append('ip', params.ip);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/anomalies?${query.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async getAnomalyDetails(id: string): Promise<{ anomaly: Anomaly; surroundingLogs: LogEntry[]; investigations: Investigation[] }> {
    const res = await fetch(`${API_BASE}/anomalies/${id}`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateAnomaly(id: string, updates: Partial<Anomaly>): Promise<{ message: string; anomaly: Anomaly }> {
    const res = await fetch(`${API_BASE}/anomalies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  async analyzeAnomalyWithAI(id: string): Promise<{ aiReport: AIReportData }> {
    const res = await fetch(`${API_BASE}/anomalies/${id}/ai-analyze`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async reanalyzeLogFile(logId: string): Promise<{ message: string; totalAnomalies: number; anomalies: Anomaly[] }> {
    const res = await fetch(`${API_BASE}/analyze/${logId}`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Investigations
  async getInvestigations(): Promise<{ investigations: Investigation[] }> {
    const res = await fetch(`${API_BASE}/investigations`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createInvestigation(data: { anomaly_id: string; notes: string; action_taken?: string; status?: string }): Promise<{ message: string; investigation: Investigation }> {
    const res = await fetch(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Analytics & Dashboard
  async getDashboardAnalytics(): Promise<{
    metrics: DashboardMetrics;
    charts: {
      anomalyTrend: Array<{ time: string; critical: number; high: number; medium: number; low: number; total: number }>;
      severityDistribution: Array<{ name: string; value: number; color: string }>;
      anomalyTypes: Array<{ name: string; count: number }>;
      topSuspiciousIps: SuspiciousIp[];
    };
    recentAnomalies: Anomaly[];
  }> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Reports
  async getReports(): Promise<{ report: any }> {
    const res = await fetch(`${API_BASE}/reports`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Users (Admin Only)
  async getUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async createUser(data: { name: string; email: string; password: string; role: string; department?: string }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateUser(id: string, updates: Partial<User> & { password?: string }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Audit Logs (Admin Only)
  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  // Settings
  async getSettings(): Promise<{ settings: SystemSettings }> {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: { ...getAuthHeader() }
    });
    return handleResponse(res);
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<{ settings: SystemSettings }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  },

  async updateProfile(data: { name?: string; department?: string; currentPassword?: string; newPassword?: string }): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};
