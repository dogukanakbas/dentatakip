/* ==============================================================================
   SOLO HEKİM PRO — REAL REST API & AUTHENTICATION CLIENT LAYER
   Connects frontend seamlessly to Express Backend (/api/*) with JWT Auth
   ============================================================================== */

class SoloHekimApiClient {
  constructor() {
    this.baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
      ? window.location.origin
      : '';
  }

  getToken() {
    return localStorage.getItem('sh_jwt_token');
  }

  getUser() {
    const raw = localStorage.getItem('sh_auth_user');
    return raw ? JSON.parse(raw) : null;
  }

  getPractice() {
    const raw = localStorage.getItem('sh_auth_practice');
    return raw ? JSON.parse(raw) : null;
  }

  setSession(token, user, practice) {
    localStorage.removeItem('sh_logged_out');
    localStorage.setItem('sh_jwt_token', token);
    localStorage.setItem('sh_auth_user', JSON.stringify(user));
    if (practice) localStorage.setItem('sh_auth_practice', JSON.stringify(practice));
  }

  clearSession() {
    localStorage.setItem('sh_logged_out', 'true');
    localStorage.removeItem('sh_jwt_token');
    localStorage.removeItem('sh_auth_user');
    localStorage.removeItem('sh_auth_practice');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP Hata: ${response.status}`);
      }

      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // Auth endpoints
  async register(doctorName, practiceTitle, email, password, phone) {
    return await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ doctorName, practiceTitle, email, password, phone })
    });
  }

  async login(email, password) {
    return await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async fetchMe() {
    return await this.request('/api/auth/me');
  }

  async getMe() {
    return await this.fetchMe();
  }

  // Resource endpoints
  async getPatients() {
    const res = await this.request('/api/patients');
    return res.ok ? res.data : [];
  }

  async createPatient(patientObj) {
    return await this.request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patientObj)
    });
  }

  async addTreatmentNote(patientId, noteObj) {
    return await this.request(`/api/patients/${patientId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteObj)
    });
  }

  async uploadPatientFile(patientId, fileName, fileData, fileCategory = 'Röntgen') {
    return await this.request(`/api/patients/${patientId}/upload`, {
      method: 'POST',
      body: JSON.stringify({ fileName, fileData, fileCategory })
    });
  }

  async getAppointments() {
    const res = await this.request('/api/appointments');
    return res.ok ? res.data : [];
  }

  async createAppointment(apptObj) {
    return await this.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(apptObj)
    });
  }

  async updateAppointmentStatus(apptId, status) {
    return await this.request(`/api/appointments/${apptId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async getPayments() {
    const res = await this.request('/api/payments');
    return res.ok ? res.data : [];
  }

  async createPayment(paymentObj) {
    return await this.request('/api/payments', {
      method: 'POST',
      body: JSON.stringify(paymentObj)
    });
  }

  async getSubscription() {
    return await this.request('/api/subscription/me');
  }

  async checkoutSubscription(planId, billingCycle) {
    return await this.request('/api/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId, billingCycle })
    });
  }

  // Super Admin methods
  async getAdminOverview() {
    return await this.request('/api/admin/overview');
  }

  async getAdminPractices() {
    return await this.request('/api/admin/practices');
  }

  async extendPractice(id, days, customDate) {
    return await this.request(`/api/admin/practices/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ days, customDate })
    });
  }

  async updatePracticeStatus(id, status) {
    return await this.request(`/api/admin/practices/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  }

  async updatePracticePlan(id, plan_type, chair_count) {
    return await this.request(`/api/admin/practices/${id}/plan`, {
      method: 'POST',
      body: JSON.stringify({ plan_type, chair_count })
    });
  }

  // Multi-Doctor Team methods
  async getTeam() {
    const res = await this.request('/api/team');
    return res.ok ? res.data : [];
  }

  async addTeamMember(memberObj) {
    return await this.request('/api/team', {
      method: 'POST',
      body: JSON.stringify(memberObj)
    });
  }

  async removeTeamMember(id) {
    return await this.request(`/api/team/${id}`, {
      method: 'DELETE'
    });
  }

  async updateTeamMember(id, memberObj) {
    return await this.request(`/api/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberObj)
    });
  }

  async getTeamPayouts() {
    const res = await this.request('/api/team/payouts');
    return res.ok ? res.data : [];
  }

  // Laboratory & Prosthesis Tracking API methods
  async getLabJobs() {
    const res = await this.request('/api/lab-jobs');
    return res.ok ? res.data : [];
  }

  async addLabJob(jobObj) {
    return await this.request('/api/lab-jobs', {
      method: 'POST',
      body: JSON.stringify(jobObj)
    });
  }

  async updateLabJobStatus(id, status, cost) {
    return await this.request(`/api/lab-jobs/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, cost })
    });
  }

  async deleteLabJob(id) {
    return await this.request(`/api/lab-jobs/${id}`, {
      method: 'DELETE'
    });
  }
}

window.apiClient = new SoloHekimApiClient();
