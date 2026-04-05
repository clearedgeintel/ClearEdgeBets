/**
 * NHL Sport Module — registers NHL grader and API client.
 */

import type { SportModule } from '../types';
import { registerSport } from '../registry';
import { NHLBetGrader } from './grader';
import { fetchNHLScoreboard } from './api-client';
import { getNHLTeamName } from './teams';

const nhlModule: SportModule = {
  sport: 'nhl',
  grader: new NHLBetGrader(),

  async fetchScoreboard(date: string) {
    return fetchNHLScoreboard(date);
  },

  getTeamName(code: string) {
    return getNHLTeamName(code);
  },
};

registerSport(nhlModule);

export default nhlModule;
export { NHLBetGrader } from './grader';
export { fetchNHLScoreboard, fetchNHLOdds, fetchNHLTeams, fetchNHLGames } from './api-client';
export { getNHLTeamName, getNHLTeamLogo } from './teams';
