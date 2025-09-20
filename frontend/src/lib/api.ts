import { ResearchDetails, ResearchRequest } from "@/types";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const researchApi = {
  submitResearch: async (
    topic: string,
    userId: string,
    provider: "openai" | "anthropic"
  ): Promise<ResearchRequest> => {
    const response = await api.post("/research", { topic, provider, userId });
    return response.data;
  },

  getAllResearch: async (userId: string): Promise<ResearchRequest[]> => {
    const response = await api.get("/research", { params: { userId } });
    return response.data;
  },

  getResearchById: async (
    id: string,
    userId: string
  ): Promise<ResearchDetails> => {
    const response = await api.get(`/research/${id}`, { params: { userId } });
    return response.data;
  },
};

export const metricsApi = {
  getRequestMetrics: async (requestId: string) => {
    const response = await api.get(`/metrics/request/${requestId}`);
    return response.data;
  },

  getAggregatedMetrics: async (hours: number = 24) => {
    const response = await api.get(`/metrics/aggregate?hours=${hours}`);
    return response.data;
  },

  getCostAnalysis: async (hours: number = 24) => {
    const response = await api.get(`/metrics/costs?hours=${hours}`);
    return response.data;
  },
};
