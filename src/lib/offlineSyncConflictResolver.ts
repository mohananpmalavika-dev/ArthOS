/**
 * Offline Sync Conflict Resolver
 * 
 * Handles merge conflicts when offline edits and server updates collide.
 * Uses CRDT-inspired vector clock approach for conflict detection and resolution.
 * 
 * Strategy:
 * 1. Vector clocks track causality (happens-before relation)
 * 2. Concurrent edits detected when neither vector dominates
 * 3. Field-level merge preserves non-conflicting changes
 * 4. Custom strategies allow domain-specific resolution
 */

export interface VectorClock {
  [deviceId: string]: number;
}

export interface VersionedValue<T> {
  value: T;
  timestamp: number;
  deviceId: string;
  vector: VectorClock;
}

export interface SyncConflict {
  field: string;
  local: VersionedValue<any>;
  remote: VersionedValue<any>;
  resolution: 'local' | 'remote' | 'merged' | 'pending';
  reason: string;
  isConcurrent: boolean;
}

export interface MergeResult {
  merged: Record<string, VersionedValue<any>>;
  conflicts: SyncConflict[];
  strategy: string;
}

export type MergeStrategy = 'auto' | 'last-write-wins' | 'local-wins' | 'remote-wins' | 'manual';

class OfflineSyncConflictResolver {
  private static instance: OfflineSyncConflictResolver;
  private customStrategies: Map<string, (local: any, remote: any) => any> = new Map();
  private deviceId: string;

  private constructor() {
    this.deviceId = this.generateDeviceId();
  }

  static getInstance(): OfflineSyncConflictResolver {
    if (!OfflineSyncConflictResolver.instance) {
      OfflineSyncConflictResolver.instance = new OfflineSyncConflictResolver();
    }
    return OfflineSyncConflictResolver.instance;
  }

  /**
   * Detect conflicts between local and remote versions
   */
  detectConflicts(
    local: Record<string, VersionedValue<any>>,
    remote: Record<string, VersionedValue<any>>
  ): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const allFields = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const field of allFields) {
      const localValue = local[field];
      const remoteValue = remote[field];

      // Skip if only one version exists
      if (!localValue || !remoteValue) {
        continue;
      }

      // If values are identical, no conflict
      if (JSON.stringify(localValue.value) === JSON.stringify(remoteValue.value)) {
        continue;
      }

      // Detect if versions are concurrent (no happens-before relation)
      const isConcurrent = this.areConcurrent(localValue.vector, remoteValue.vector);

      if (isConcurrent || !this.happensBefore(localValue.vector, remoteValue.vector)) {
        // Potential conflict
        const conflict: SyncConflict = {
          field,
          local: localValue,
          remote: remoteValue,
          resolution: 'pending',
          reason: isConcurrent
            ? 'Concurrent edits on same field'
            : 'Causality unclear',
          isConcurrent
        };

        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  /**
   * Merge two versions using specified strategy
   */
  merge(
    local: Record<string, VersionedValue<any>>,
    remote: Record<string, VersionedValue<any>>,
    strategy: MergeStrategy = 'auto'
  ): MergeResult {
    const merged: Record<string, VersionedValue<any>> = {};
    const conflicts: SyncConflict[] = [];
    const allFields = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const field of allFields) {
      const localValue = local[field];
      const remoteValue = remote[field];

      // Only local value exists
      if (localValue && !remoteValue) {
        merged[field] = localValue;
        continue;
      }

      // Only remote value exists
      if (!localValue && remoteValue) {
        merged[field] = remoteValue;
        continue;
      }

      // Both exist - check for conflict
      if (localValue && remoteValue) {
        if (JSON.stringify(localValue.value) === JSON.stringify(remoteValue.value)) {
          // Same value, no conflict
          merged[field] = localValue;
          continue;
        }

        const isConcurrent = this.areConcurrent(localValue.vector, remoteValue.vector);

        if (!isConcurrent && this.happensBefore(localValue.vector, remoteValue.vector)) {
          // Remote is causally after local
          merged[field] = remoteValue;
          continue;
        }

        if (!isConcurrent && this.happensBefore(remoteValue.vector, localValue.vector)) {
          // Local is causally after remote
          merged[field] = localValue;
          continue;
        }

        // Concurrent edit - resolve based on strategy
        const result = this.resolveConflict(field, localValue, remoteValue, strategy);

        if (result.resolved) {
          merged[field] = result.value;
        } else {
          // Keep conflict pending
          conflicts.push({
            field,
            local: localValue,
            remote: remoteValue,
            resolution: 'pending',
            reason: 'Concurrent edits (user confirmation required)',
            isConcurrent: true
          });

          // Default to local for merged result
          merged[field] = localValue;
        }
      }
    }

    return { merged, conflicts, strategy };
  }

  /**
   * Check if A happens-before B (A causally precedes B)
   * Uses vector clock comparison: A < B if A[i] <= B[i] for all i, and A != B
   */
  happensBefore(a: VectorClock, b: VectorClock): boolean {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let hasLess = false;

    for (const key of allKeys) {
      const aVal = a[key] || 0;
      const bVal = b[key] || 0;

      if (aVal > bVal) {
        return false; // A not <= B, so not happens-before
      }

      if (aVal < bVal) {
        hasLess = true; // Found at least one position where A < B
      }
    }

    return hasLess; // A happens-before B iff A < B and A != B
  }

  /**
   * Check if versions are concurrent (neither happens-before the other)
   */
  areConcurrent(a: VectorClock, b: VectorClock): boolean {
    const aHappensBefore = this.happensBefore(a, b);
    const bHappensBefore = this.happensBefore(b, a);

    return !aHappensBefore && !bHappensBefore;
  }

  /**
   * Increment vector clock for this device
   */
  incrementVector(vector: VectorClock, deviceId?: string): VectorClock {
    const device = deviceId || this.deviceId;
    return {
      ...vector,
      [device]: (vector[device] || 0) + 1
    };
  }

  /**
   * Register custom merge strategy for a field
   */
  registerCustomStrategy(
    field: string,
    strategy: (local: any, remote: any) => any
  ): void {
    this.customStrategies.set(field, strategy);
    console.info('Custom merge strategy registered', { field });
  }

  /**
   * Get device ID for this instance
   */
  getDeviceId(): string {
    return this.deviceId;
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    deviceId: string;
    customStrategiesCount: number;
  } {
    return {
      deviceId: this.deviceId,
      customStrategiesCount: this.customStrategies.size
    };
  }

  // ============ Private helpers ============

  private resolveConflict(
    field: string,
    local: VersionedValue<any>,
    remote: VersionedValue<any>,
    strategy: MergeStrategy
  ): { resolved: boolean; value: VersionedValue<any> } {
    // Check for custom strategy
    if (this.customStrategies.has(field)) {
      const customFn = this.customStrategies.get(field)!;

      try {
        const mergedValue = customFn(local.value, remote.value);

        return {
          resolved: true,
          value: {
            value: mergedValue,
            timestamp: Math.max(local.timestamp, remote.timestamp),
            deviceId: this.deviceId,
            vector: this.mergeVectors(local.vector, remote.vector)
          }
        };
      } catch (error) {
        console.error('Custom merge strategy failed:', error);
        // Fall through to default strategy
      }
    }

    // Apply selected strategy
    switch (strategy) {
      case 'auto':
        // Field-level merge: if different types/sources, merge; if same source, last-write-wins
        return this.fieldLevelMerge(local, remote);

      case 'last-write-wins':
        return {
          resolved: true,
          value: local.timestamp > remote.timestamp ? local : remote
        };

      case 'local-wins':
        return {
          resolved: true,
          value: local
        };

      case 'remote-wins':
        return {
          resolved: true,
          value: remote
        };

      case 'manual':
      default:
        return { resolved: false, value: local };
    }
  }

  private fieldLevelMerge(
    local: VersionedValue<any>,
    remote: VersionedValue<any>
  ): { resolved: boolean; value: VersionedValue<any> } {
    // If values are objects, try to merge properties
    if (
      typeof local.value === 'object' &&
      typeof remote.value === 'object' &&
      !Array.isArray(local.value) &&
      !Array.isArray(remote.value)
    ) {
      const merged = {
        ...local.value,
        ...remote.value
      };

      return {
        resolved: true,
        value: {
          value: merged,
          timestamp: Math.max(local.timestamp, remote.timestamp),
          deviceId: this.deviceId,
          vector: this.mergeVectors(local.vector, remote.vector)
        }
      };
    }

    // Otherwise, last-write-wins
    return {
      resolved: true,
      value: local.timestamp > remote.timestamp ? local : remote
    };
  }

  private mergeVectors(a: VectorClock, b: VectorClock): VectorClock {
    const merged: VectorClock = {};
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

    for (const key of allKeys) {
      merged[key] = Math.max(a[key] || 0, b[key] || 0);
    }

    return merged;
  }

  private generateDeviceId(): string {
    // Get or create device ID
    const stored = localStorage.getItem('arth_device_id');
    if (stored) return stored;

    const deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('arth_device_id', deviceId);

    return deviceId;
  }
}

/**
 * Global singleton getter
 */
export function getOfflineSyncConflictResolver(): OfflineSyncConflictResolver {
  return OfflineSyncConflictResolver.getInstance();
}

export default OfflineSyncConflictResolver;
