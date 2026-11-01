import { getAuthSession } from './authStorage';
import { post } from './api';

export interface HeliosResponse {
  answer: string;
  mode: 'knowledge' | 'local' | 'server' | 'gemini';
  source?: string;
}

export const HELIOS_WELCOME = "Hey! I'm Helios ☀️ Your solar sidekick. Bills, panels, installers, or confusing credits? Ask away!";

export const getHeliosAnswer = async (question: string): Promise<HeliosResponse> => {
  const session = getAuthSession();
  if (session?.token) {
    return post('/helios/chat', { question, propertyId: session.workspace === 'commercial' ? localStorage.getItem(`solaris_active_property:${session.accountId}`) || undefined : undefined });
  }
  const normalized = question.toLowerCase();

  if (normalized.includes('bill') || normalized.includes('saving') || normalized.includes('cost')) {
    return {
      answer: 'Start by comparing your monthly bill, roof area, and sanctioned load. Solaris models the savings before any official credit or approval claim.',
      mode: 'local'
    };
  }

  if (normalized.includes('installer') || normalized.includes('provider') || normalized.includes('recommend')) {
    return {
      answer: 'Use SolarMatch to shortlist compatible installers by service area, capacity, and budget. Demo providers are clearly labelled as fictional profiles only.',
      mode: 'local'
    };
  }

  if (normalized.includes('vnm') || normalized.includes('credit') || normalized.includes('approval')) {
    return {
      answer: 'VNM and official credit treatment are always shown as modelled or evidence-backed only. Solaris does not grant DISCOM approvals.',
      mode: 'local'
    };
  }

  if (normalized.includes('capex') || normalized.includes('resco') || normalized.includes('finance')) {
    return {
      answer: 'CAPEX means ownership upfront. RESCO means a third party owns the system and you pay for the generated value or service under contract. Solaris helps compare both, but does not issue loans or legal contracts.',
      mode: 'local'
    };
  }

  return {
    answer: 'Solaris helps with rooftop feasibility, cohort planning, installer matching, and savings tracking. Ask me about bills, credits, project sizing, or the demo journey.',
    mode: 'local'
  };
};
