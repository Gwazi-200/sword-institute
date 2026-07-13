import { auth, onAuthStateChanged } from '../firebase.js';
import { fetchDashboardData } from '../services/dashboardService.js';
import { getStudentIntelligenceSnapshot } from '../services/studentProfileService.js';
import { getAnalyticsSnapshot } from '../services/analyticsService.js';
import { getCareerRecommendations } from '../services/careerService.js';
import { renderStudentIntelligenceCard } from '../components/studentIntelligenceCard.js';
import { createDashboardHero } from '../components/dashboardHero.js';
import { createMissionCard, createRecommendationCard } from '../components/dashboardModules.js';
import { initializeAI } from '../services/aiServiceInit.js';

let initializationPromise = null;
let runtimeState = {
  initialized: false,
  aiReady: false,
  services: null,
};

function registerGlobals(services) {
  if (typeof window !== 'undefined') {
    window.dashboardService = { fetchDashboardData: services.fetchDashboardData };
    window.studentIntelligence = {
      getStudentIntelligenceSnapshot: services.getStudentIntelligenceSnapshot,
      getAnalyticsSnapshot: services.getAnalyticsSnapshot,
      getCareerRecommendations: services.getCareerRecommendations,
      renderStudentIntelligenceCard: services.renderStudentIntelligenceCard,
    };
    window.dashboardComponents = {
      createDashboardHero: services.createDashboardHero,
      createMissionCard: services.createMissionCard,
      createRecommendationCard: services.createRecommendationCard,
    };
    window.dashboardRuntime = {
      auth,
      initialized: true,
      aiReady: services.aiReady,
      services,
    };
  }
}

export async function initializeDashboardApp() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const aiService = await initializeAI();
      const services = {
        auth,
        onAuthStateChanged,
        fetchDashboardData,
        getStudentIntelligenceSnapshot,
        getAnalyticsSnapshot,
        getCareerRecommendations,
        renderStudentIntelligenceCard,
        createDashboardHero,
        createMissionCard,
        createRecommendationCard,
        aiReady: Boolean(aiService),
      };

      runtimeState = {
        initialized: true,
        aiReady: Boolean(aiService),
        services,
      };

      registerGlobals(services);
      return services;
    } catch (error) {
      console.error('[DashboardInit] Initialization failed:', error);
      runtimeState = {
        initialized: true,
        aiReady: false,
        services: null,
      };
      registerGlobals({
        auth,
        onAuthStateChanged,
        fetchDashboardData,
        getStudentIntelligenceSnapshot,
        getAnalyticsSnapshot,
        getCareerRecommendations,
        renderStudentIntelligenceCard,
        createDashboardHero,
        createMissionCard,
        createRecommendationCard,
        aiReady: false,
      });
      return runtimeState.services;
    }
  })();

  return initializationPromise;
}

export function getDashboardRuntime() {
  return runtimeState;
}

export default initializeDashboardApp;
