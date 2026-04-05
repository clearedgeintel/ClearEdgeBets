/**
 * MLB Sport Module — registers MLB grader and API client.
 */

import type { SportModule } from '../types';
import { registerSport } from '../registry';
import { MLBBetGrader } from './grader';
import { fetchMLBScoreboard } from './api-client';
import { getMLBTeamName } from './teams';

const mlbModule: SportModule = {
  sport: 'mlb',
  grader: new MLBBetGrader(),

  async fetchScoreboard(date: string) {
    return fetchMLBScoreboard(date);
  },

  getTeamName(code: string) {
    return getMLBTeamName(code);
  },
};

// Auto-register on import
registerSport(mlbModule);

export default mlbModule;
export { MLBBetGrader } from './grader';
export { fetchMLBScoreboard } from './api-client';
export { getMLBTeamName, getMLBTeamCode } from './teams';
