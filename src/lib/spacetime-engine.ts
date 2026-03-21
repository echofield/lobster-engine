/**
 * SPACE-TIME ENGINE
 *
 * Conditional access system based on real-world variables:
 * - SPACE: Geographic location (city, coordinates, radius)
 * - TIME: Temporal conditions (moon phase, time of day, season, specific dates)
 *
 * Artists define conditions. Listeners must meet them to access the experience.
 */

// ============ TYPES ============

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface SpaceCondition {
  type: 'anywhere' | 'city' | 'coordinates' | 'country';
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number; // How close you need to be
}

export interface TimeCondition {
  type: 'anytime' | 'moon_phase' | 'time_range' | 'date_range' | 'season' | 'day_of_week' | 'specific_date';
  // Moon phase
  moonPhase?: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
  // Time range (24h format)
  startHour?: number;
  endHour?: number;
  // Date range
  startDate?: string; // ISO date
  endDate?: string;
  // Season
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  // Day of week
  dayOfWeek?: number[]; // 0=Sunday, 6=Saturday
  // Specific date (recurring yearly)
  month?: number; // 1-12
  day?: number; // 1-31
}

export interface EvolutionRule {
  parameter: string; // Which sound parameter to evolve
  source: 'moon_cycle' | 'time_of_day' | 'season' | 'days_since_release' | 'listener_count';
  mapping: 'linear' | 'sine' | 'exponential';
  min: number;
  max: number;
}

export interface SpaceTimeConditions {
  id: string;
  name: string;
  description?: string;
  space: SpaceCondition;
  time: TimeCondition;
  evolution?: EvolutionRule[];
  createdAt: string;
  createdBy?: string;
}

export interface ConditionResult {
  allowed: boolean;
  reason?: string;
  nextAvailable?: Date;
  nextLocation?: string;
  currentValues?: {
    moonPhase?: string;
    season?: string;
    localTime?: string;
    location?: GeoLocation;
  };
  evolutionValues?: Record<string, number>;
}

// ============ CONSTANTS ============

const CITIES: Record<string, GeoLocation> = {
  'tokyo': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo', country: 'Japan' },
  'paris': { latitude: 48.8566, longitude: 2.3522, city: 'Paris', country: 'France' },
  'new york': { latitude: 40.7128, longitude: -74.0060, city: 'New York', country: 'USA' },
  'london': { latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' },
  'berlin': { latitude: 52.5200, longitude: 13.4050, city: 'Berlin', country: 'Germany' },
  'los angeles': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles', country: 'USA' },
  'sydney': { latitude: -33.8688, longitude: 151.2093, city: 'Sydney', country: 'Australia' },
  'dubai': { latitude: 25.2048, longitude: 55.2708, city: 'Dubai', country: 'UAE' },
  'seoul': { latitude: 37.5665, longitude: 126.9780, city: 'Seoul', country: 'South Korea' },
  'sao paulo': { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo', country: 'Brazil' },
  'mumbai': { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', country: 'India' },
  'cairo': { latitude: 30.0444, longitude: 31.2357, city: 'Cairo', country: 'Egypt' },
  'moscow': { latitude: 55.7558, longitude: 37.6173, city: 'Moscow', country: 'Russia' },
  'shanghai': { latitude: 31.2304, longitude: 121.4737, city: 'Shanghai', country: 'China' },
  'lagos': { latitude: 6.5244, longitude: 3.3792, city: 'Lagos', country: 'Nigeria' },
  'mexico city': { latitude: 19.4326, longitude: -99.1332, city: 'Mexico City', country: 'Mexico' },
  'amsterdam': { latitude: 52.3676, longitude: 4.9041, city: 'Amsterdam', country: 'Netherlands' },
  'stockholm': { latitude: 59.3293, longitude: 18.0686, city: 'Stockholm', country: 'Sweden' },
  'reykjavik': { latitude: 64.1466, longitude: -21.9426, city: 'Reykjavik', country: 'Iceland' },
  'marrakech': { latitude: 31.6295, longitude: -7.9811, city: 'Marrakech', country: 'Morocco' },
};

const MOON_PHASE_NAMES = [
  'new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
  'full', 'waning_gibbous', 'last_quarter', 'waning_crescent'
] as const;

// ============ SPACE-TIME ENGINE ============

export class SpaceTimeEngine {
  private currentLocation: GeoLocation | null = null;
  private locationWatchId: number | null = null;
  private conditions: SpaceTimeConditions | null = null;

  // Callbacks
  public onLocationChange?: (location: GeoLocation) => void;
  public onConditionChange?: (result: ConditionResult) => void;

  constructor() {}

  // ============ GEOLOCATION ============

  async requestLocation(): Promise<GeoLocation | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('[SpaceTime] Geolocation not supported');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeoLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          // Try to identify city
          const city = this.identifyCity(location);
          if (city) {
            location.city = city.city;
            location.country = city.country;
          }
          this.currentLocation = location;
          this.onLocationChange?.(location);
          resolve(location);
        },
        (error) => {
          console.warn('[SpaceTime] Geolocation error:', error.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  watchLocation(): void {
    if (!navigator.geolocation || this.locationWatchId !== null) return;

    this.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: GeoLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        const city = this.identifyCity(location);
        if (city) {
          location.city = city.city;
          location.country = city.country;
        }
        this.currentLocation = location;
        this.onLocationChange?.(location);
      },
      (error) => console.warn('[SpaceTime] Watch error:', error.message),
      { enableHighAccuracy: true }
    );
  }

  stopWatchingLocation(): void {
    if (this.locationWatchId !== null) {
      navigator.geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
  }

  private identifyCity(location: GeoLocation): GeoLocation | null {
    // Find closest known city within 50km
    let closest: GeoLocation | null = null;
    let closestDistance = Infinity;

    for (const city of Object.values(CITIES)) {
      const distance = this.haversineDistance(location, city);
      if (distance < 50 && distance < closestDistance) {
        closest = city;
        closestDistance = distance;
      }
    }

    return closest;
  }

  private haversineDistance(a: GeoLocation, b: GeoLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(b.latitude - a.latitude);
    const dLon = this.toRad(b.longitude - a.longitude);
    const lat1 = this.toRad(a.latitude);
    const lat2 = this.toRad(b.latitude);

    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ============ MOON PHASE ============

  getMoonPhase(date: Date = new Date()): typeof MOON_PHASE_NAMES[number] {
    // Calculate moon phase using synodic month approximation
    // Known new moon: January 6, 2000
    const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0);
    const synodicMonth = 29.53058867; // days

    const daysSinceKnownNew = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const currentCycle = daysSinceKnownNew / synodicMonth;
    const phase = currentCycle - Math.floor(currentCycle); // 0 to 1

    // Map to 8 phases
    const phaseIndex = Math.floor(phase * 8) % 8;
    return MOON_PHASE_NAMES[phaseIndex];
  }

  getMoonPhasePercent(date: Date = new Date()): number {
    // Returns 0-1 where 0.5 = full moon
    const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0);
    const synodicMonth = 29.53058867;
    const daysSinceKnownNew = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const currentCycle = daysSinceKnownNew / synodicMonth;
    return currentCycle - Math.floor(currentCycle);
  }

  getNextFullMoon(from: Date = new Date()): Date {
    const phase = this.getMoonPhasePercent(from);
    const synodicMonth = 29.53058867;
    const daysToFull = ((0.5 - phase + 1) % 1) * synodicMonth;
    return new Date(from.getTime() + daysToFull * 24 * 60 * 60 * 1000);
  }

  // ============ SEASON ============

  getSeason(date: Date = new Date(), hemisphere: 'north' | 'south' = 'north'): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = date.getMonth(); // 0-11

    let season: 'spring' | 'summer' | 'autumn' | 'winter';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'autumn';
    else season = 'winter';

    // Flip for southern hemisphere
    if (hemisphere === 'south') {
      const flip: Record<string, 'spring' | 'summer' | 'autumn' | 'winter'> = {
        spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer'
      };
      season = flip[season];
    }

    return season;
  }

  // ============ CONDITION EVALUATION ============

  setConditions(conditions: SpaceTimeConditions): void {
    this.conditions = conditions;
  }

  evaluate(conditions?: SpaceTimeConditions, location?: GeoLocation, date?: Date): ConditionResult {
    const cond = conditions || this.conditions;
    const loc = location || this.currentLocation;
    const now = date || new Date();

    if (!cond) {
      return { allowed: true, reason: 'No conditions set' };
    }

    const currentValues: ConditionResult['currentValues'] = {
      moonPhase: this.getMoonPhase(now),
      season: this.getSeason(now),
      localTime: now.toLocaleTimeString(),
      location: loc || undefined,
    };

    // Check SPACE condition
    const spaceResult = this.evaluateSpace(cond.space, loc);
    if (!spaceResult.allowed) {
      return { ...spaceResult, currentValues };
    }

    // Check TIME condition
    const timeResult = this.evaluateTime(cond.time, now);
    if (!timeResult.allowed) {
      return { ...timeResult, currentValues };
    }

    // Calculate evolution values if defined
    let evolutionValues: Record<string, number> | undefined;
    if (cond.evolution && cond.evolution.length > 0) {
      evolutionValues = this.calculateEvolution(cond.evolution, now);
    }

    return {
      allowed: true,
      currentValues,
      evolutionValues,
    };
  }

  private evaluateSpace(space: SpaceCondition, location: GeoLocation | null): ConditionResult {
    if (space.type === 'anywhere') {
      return { allowed: true };
    }

    if (!location) {
      return {
        allowed: false,
        reason: 'Location required. Enable location access.',
        nextLocation: space.city || space.country || 'specified location',
      };
    }

    if (space.type === 'city' && space.city) {
      const targetCity = CITIES[space.city.toLowerCase()];
      if (!targetCity) {
        return { allowed: false, reason: `Unknown city: ${space.city}` };
      }

      const distance = this.haversineDistance(location, targetCity);
      const radius = space.radiusKm || 25;

      if (distance > radius) {
        return {
          allowed: false,
          reason: `Only available in ${space.city}`,
          nextLocation: space.city,
        };
      }
    }

    if (space.type === 'coordinates' && space.latitude !== undefined && space.longitude !== undefined) {
      const target: GeoLocation = { latitude: space.latitude, longitude: space.longitude };
      const distance = this.haversineDistance(location, target);
      const radius = space.radiusKm || 10;

      if (distance > radius) {
        return {
          allowed: false,
          reason: `Must be within ${radius}km of location`,
        };
      }
    }

    if (space.type === 'country' && space.country) {
      if (location.country?.toLowerCase() !== space.country.toLowerCase()) {
        return {
          allowed: false,
          reason: `Only available in ${space.country}`,
          nextLocation: space.country,
        };
      }
    }

    return { allowed: true };
  }

  private evaluateTime(time: TimeCondition, now: Date): ConditionResult {
    if (time.type === 'anytime') {
      return { allowed: true };
    }

    if (time.type === 'moon_phase' && time.moonPhase) {
      const currentPhase = this.getMoonPhase(now);
      if (currentPhase !== time.moonPhase) {
        const nextFull = time.moonPhase === 'full' ? this.getNextFullMoon(now) : undefined;
        return {
          allowed: false,
          reason: `Only available during ${time.moonPhase.replace('_', ' ')} moon`,
          nextAvailable: nextFull,
        };
      }
    }

    if (time.type === 'time_range' && time.startHour !== undefined && time.endHour !== undefined) {
      const hour = now.getHours();
      const inRange = time.startHour <= time.endHour
        ? hour >= time.startHour && hour < time.endHour
        : hour >= time.startHour || hour < time.endHour; // Overnight range

      if (!inRange) {
        const nextStart = new Date(now);
        nextStart.setHours(time.startHour, 0, 0, 0);
        if (nextStart <= now) nextStart.setDate(nextStart.getDate() + 1);

        return {
          allowed: false,
          reason: `Only available ${time.startHour}:00 - ${time.endHour}:00`,
          nextAvailable: nextStart,
        };
      }
    }

    if (time.type === 'season' && time.season) {
      const currentSeason = this.getSeason(now);
      if (currentSeason !== time.season) {
        return {
          allowed: false,
          reason: `Only available in ${time.season}`,
        };
      }
    }

    if (time.type === 'day_of_week' && time.dayOfWeek) {
      const today = now.getDay();
      if (!time.dayOfWeek.includes(today)) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const availableDays = time.dayOfWeek.map(d => dayNames[d]).join(', ');
        return {
          allowed: false,
          reason: `Only available on ${availableDays}`,
        };
      }
    }

    if (time.type === 'date_range' && time.startDate && time.endDate) {
      const start = new Date(time.startDate);
      const end = new Date(time.endDate);
      if (now < start || now > end) {
        return {
          allowed: false,
          reason: `Only available ${time.startDate} to ${time.endDate}`,
          nextAvailable: now < start ? start : undefined,
        };
      }
    }

    if (time.type === 'specific_date' && time.month && time.day) {
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();
      if (currentMonth !== time.month || currentDay !== time.day) {
        const nextDate = new Date(now.getFullYear(), time.month - 1, time.day);
        if (nextDate < now) nextDate.setFullYear(nextDate.getFullYear() + 1);
        return {
          allowed: false,
          reason: `Only available on ${time.month}/${time.day}`,
          nextAvailable: nextDate,
        };
      }
    }

    return { allowed: true };
  }

  // ============ EVOLUTION ============

  private calculateEvolution(rules: EvolutionRule[], now: Date): Record<string, number> {
    const values: Record<string, number> = {};

    for (const rule of rules) {
      let normalized = 0; // 0 to 1

      switch (rule.source) {
        case 'moon_cycle':
          normalized = this.getMoonPhasePercent(now);
          break;
        case 'time_of_day':
          normalized = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
          break;
        case 'season':
          const seasons = ['winter', 'spring', 'summer', 'autumn'];
          const currentSeason = this.getSeason(now);
          normalized = seasons.indexOf(currentSeason) / 4;
          break;
        case 'days_since_release':
          // Would need release date in conditions
          normalized = 0;
          break;
      }

      // Apply mapping
      let mapped = normalized;
      if (rule.mapping === 'sine') {
        mapped = (Math.sin(normalized * Math.PI * 2) + 1) / 2;
      } else if (rule.mapping === 'exponential') {
        mapped = Math.pow(normalized, 2);
      }

      // Scale to min/max
      values[rule.parameter] = rule.min + mapped * (rule.max - rule.min);
    }

    return values;
  }

  // ============ PRESETS ============

  static presets = {
    fullMoonOnly: (): SpaceTimeConditions => ({
      id: 'full-moon',
      name: 'Full Moon',
      description: 'Only available during full moon',
      space: { type: 'anywhere' },
      time: { type: 'moon_phase', moonPhase: 'full' },
      createdAt: new Date().toISOString(),
    }),

    tokyoNights: (): SpaceTimeConditions => ({
      id: 'tokyo-nights',
      name: 'Tokyo Nights',
      description: 'Only in Tokyo, 10PM to 4AM',
      space: { type: 'city', city: 'Tokyo', radiusKm: 30 },
      time: { type: 'time_range', startHour: 22, endHour: 4 },
      createdAt: new Date().toISOString(),
    }),

    winterSolstice: (): SpaceTimeConditions => ({
      id: 'winter-solstice',
      name: 'Winter Solstice',
      description: 'December 21st only',
      space: { type: 'anywhere' },
      time: { type: 'specific_date', month: 12, day: 21 },
      createdAt: new Date().toISOString(),
    }),

    midnightGlobal: (): SpaceTimeConditions => ({
      id: 'midnight',
      name: 'Midnight Hour',
      description: 'Only at midnight (your timezone)',
      space: { type: 'anywhere' },
      time: { type: 'time_range', startHour: 0, endHour: 1 },
      createdAt: new Date().toISOString(),
    }),

    summerParis: (): SpaceTimeConditions => ({
      id: 'summer-paris',
      name: 'Paris Summer',
      description: 'Paris in summer only',
      space: { type: 'city', city: 'Paris', radiusKm: 20 },
      time: { type: 'season', season: 'summer' },
      createdAt: new Date().toISOString(),
    }),

    evolvingMoon: (): SpaceTimeConditions => ({
      id: 'evolving-moon',
      name: 'Lunar Evolution',
      description: 'Sound evolves with moon cycle',
      space: { type: 'anywhere' },
      time: { type: 'anytime' },
      evolution: [
        { parameter: 'filterFreq', source: 'moon_cycle', mapping: 'sine', min: 200, max: 4000 },
        { parameter: 'reverbMix', source: 'moon_cycle', mapping: 'sine', min: 0.1, max: 0.8 },
      ],
      createdAt: new Date().toISOString(),
    }),
  };

  // ============ UTILITIES ============

  getKnownCities(): string[] {
    return Object.keys(CITIES);
  }

  getCityLocation(city: string): GeoLocation | null {
    return CITIES[city.toLowerCase()] || null;
  }

  dispose(): void {
    this.stopWatchingLocation();
  }
}

export default SpaceTimeEngine;
