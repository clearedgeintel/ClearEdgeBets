/**
 * NBA Sport Module — registers NBA grader and API client.
 */

import type { SportModule } from '../types';
import { registerSport } from '../registry';
import { NBABetGrader } from './grader';
import { fetchNBAScoreboard } from './api-client';
import { getNBATeamName } from './teams';

const nbaModule: SportModule = {
  sport: 'nba',
  grader: new NBABetGrader(),

  async fetchScoreboard(date: string) {
    return fetchNBAScoreboard(date);
  },

  getTeamName(code: string) {
    return getNBATeamName(code);
  },
};

registerSport(nbaModule);

export default nbaModule;
export { NBABetGrader } from './grader';
export { fetchNBAScoreboard, fetchNBAOdds, fetchNBATeams, fetchNBAGames, fetchNBABoxScore } from './api-client';
export { getNBATeamName, getNBATeamLogo } from './teams';
