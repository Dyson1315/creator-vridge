'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { UseFormWatch, UseFormGetValues, FieldValues } from 'react-hook-form';

export interface AutoSaveOptions {
  key: string;
  delay?: number;
  enabled?: boolean;
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
  onError?: (error: Error) => void;
  validate?: (data: any) => boolean;
  maxAge?: number; // in milliseconds
}

export interface AutoSaveState {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  hasDraft: boolean;
  draftAge: number | null; // in milliseconds
}

export interface AutoSaveActions {
  saveDraft: () => Promise<void>;
  clearDraft: () => void;
  restoreDraft: () => Promise<any>;
  forceSave: () => Promise<void>;
}

const STORAGE_PREFIX = 'profile_draft_';
const DEFAULT_DELAY = 2000; // 2 seconds
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useAutoSave<T extends FieldValues>(
  watch: UseFormWatch<T>,
  getValues: UseFormGetValues<T>,
  options: AutoSaveOptions
): [AutoSaveState, AutoSaveActions] {
  const {
    key,
    delay = DEFAULT_DELAY,
    enabled = true,
    onSave,
    onRestore,
    onError,
    validate,
    maxAge = DEFAULT_MAX_AGE
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isAutoSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    hasDraft: false,
    draftAge: null
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<any>(null);
  const storageKey = `${STORAGE_PREFIX}${key}`;

  // Check for existing draft on mount
  useEffect(() => {
    checkForDraft();
  }, []);

  const checkForDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const age = Date.now() - parsed.timestamp;
        
        if (age <= maxAge) {
          setState(prev => ({
            ...prev,
            hasDraft: true,
            draftAge: age
          }));
        } else {
          // Remove expired draft
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn('Error checking for draft:', error);
    }
  }, [storageKey, maxAge]);

  const saveToDraft = useCallback(async (data: T, isManual = false) => {
    if (!enabled && !isManual) return;

    try {
      // Validate data if validator provided
      if (validate && !validate(data)) {
        return;
      }

      setState(prev => ({ ...prev, isAutoSaving: true }));

      const draftData = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };

      // Check storage quota
      try {
        localStorage.setItem(storageKey, JSON.stringify(draftData));
      } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
          // Try to clear old drafts and retry
          clearOldDrafts();
          localStorage.setItem(storageKey, JSON.stringify(draftData));
        } else {
          throw error;
        }
      }

      lastSavedDataRef.current = data;
      const now = new Date();

      setState(prev => ({
        ...prev,
        isAutoSaving: false,
        lastSaved: now,
        hasUnsavedChanges: false,
        hasDraft: true,
        draftAge: 0
      }));

      onSave?.(data);
    } catch (error) {
      setState(prev => ({ ...prev, isAutoSaving: false }));
      onError?.(error as Error);
      console.error('Auto-save error:', error);
    }
  }, [enabled, validate, storageKey, onSave, onError]);

  const clearOldDrafts = useCallback(() => {
    const keys = Object.keys(localStorage);
    const draftKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
    
    draftKeys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          const age = Date.now() - parsed.timestamp;
          if (age > maxAge) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Remove corrupted entries
        localStorage.removeItem(key);
      }
    });
  }, [maxAge]);

  const debouncedSave = useCallback((data: T) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToDraft(data);
    }, delay);
  }, [delay, saveToDraft]);

  // Watch for form changes
  useEffect(() => {
    const subscription = watch((data) => {
      if (!enabled) return;

      // Check if data has actually changed
      const currentData = getValues();
      const hasChanged = JSON.stringify(currentData) !== JSON.stringify(lastSavedDataRef.current);

      setState(prev => ({
        ...prev,
        hasUnsavedChanges: hasChanged
      }));

      if (hasChanged) {
        debouncedSave(currentData);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, getValues, enabled, debouncedSave]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.hasUnsavedChanges) {
        saveToDraft(getValues(), true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && state.hasUnsavedChanges) {
        saveToDraft(getValues(), true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.hasUnsavedChanges, getValues, saveToDraft]);

  const actions: AutoSaveActions = {
    saveDraft: useCallback(async () => {
      await saveToDraft(getValues(), true);
    }, [saveToDraft, getValues]),

    clearDraft: useCallback(() => {
      try {
        localStorage.removeItem(storageKey);
        setState(prev => ({
          ...prev,
          hasDraft: false,
          draftAge: null,
          hasUnsavedChanges: false
        }));
      } catch (error) {
        onError?.(error as Error);
      }
    }, [storageKey, onError]),

    restoreDraft: useCallback(async () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const age = Date.now() - parsed.timestamp;
          
          if (age <= maxAge) {
            lastSavedDataRef.current = parsed.data;
            setState(prev => ({
              ...prev,
              hasDraft: true,
              draftAge: age,
              hasUnsavedChanges: false
            }));
            
            onRestore?.(parsed.data);
            return parsed.data;
          } else {
            localStorage.removeItem(storageKey);
            setState(prev => ({
              ...prev,
              hasDraft: false,
              draftAge: null
            }));
          }
        }
        return null;
      } catch (error) {
        onError?.(error as Error);
        return null;
      }
    }, [storageKey, maxAge, onRestore, onError]),

    forceSave: useCallback(async () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      await saveToDraft(getValues(), true);
    }, [saveToDraft, getValues])
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return [state, actions];
}

// Utility function to format time ago
export function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${days}日前`;
}

// Utility function to format draft age
export function formatDraftAge(ageMs: number): string {
  const date = new Date(Date.now() - ageMs);
  return formatTimeAgo(date);
}