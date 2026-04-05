/**
 * Sport Module Registry — pluggable architecture for multi-sport support.
 * Each sport registers itself on import. Settlement engine looks up graders here.
 */

import type { SportKey, SportModule } from './types';

const registry = new Map<SportKey, SportModule>();

export function registerSport(module: SportModule): void {
  registry.set(module.sport, module);
  console.log(`✓ Sport module registered: ${module.sport}`);
}

export function getSportModule(sport: SportKey): SportModule {
  const mod = registry.get(sport);
  if (!mod) throw new Error(`Sport module not registered: ${sport}`);
  return mod;
}

export function hasSportModule(sport: SportKey): boolean {
  return registry.has(sport);
}

export function getAllRegisteredSports(): SportKey[] {
  return [...registry.keys()];
}
