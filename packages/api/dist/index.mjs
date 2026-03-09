// src/client.ts
import axios from "axios";
var ApiClient = class {
  constructor(baseURL = process.env.API_BASE_URL || "http://localhost:3001/api") {
    this.client = axios.create({
      baseURL,
      timeout: 1e4,
      headers: { "Content-Type": "application/json" }
    });
  }
  async getUser(id) {
    const res = await this.client.get(`/users/${id}`);
    return res.data;
  }
  async request(config) {
    const res = await this.client.request(config);
    return res.data;
  }
};
var apiClient = new ApiClient();
export {
  ApiClient,
  apiClient
};
//# sourceMappingURL=index.mjs.map