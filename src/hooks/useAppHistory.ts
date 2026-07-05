import { useState, useEffect, useCallback, useRef } from 'react';
import { Ingredient, MealPlan, CookingIdea, ShoppingItem } from '../types';

export interface AppState {
  ingredients: Ingredient[];
  mealPlans: MealPlan;
  cookingIdeas: CookingIdea[];
  shoppingList: ShoppingItem[];
}

export function useAppHistory(initialState: AppState) {
  const [state, setState] = useState<AppState>(initialState);
  const [past, setPast] = useState<AppState[]>([]);
  const [future, setFuture] = useState<AppState[]>([]);

  // Use a ref to keep the latest undo/redo functions available to the event listener
  // without re-registering the event listener too often.
  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});

  const setInitialState = useCallback((newState: AppState) => {
    setState(newState);
    setPast([]);
    setFuture([]);
  }, []);

  const updateState = useCallback((newStateOrUpdater: AppState | ((prev: AppState) => AppState), commit = true) => {
    setState(prev => {
      const next = typeof newStateOrUpdater === 'function' ? newStateOrUpdater(prev) : newStateOrUpdater;
      
      // Save to localStorage
      localStorage.setItem('freshlog_ingredients', JSON.stringify(next.ingredients));
      localStorage.setItem('freshlog_mealplan', JSON.stringify(next.mealPlans));
      localStorage.setItem('freshlog_ideas', JSON.stringify(next.cookingIdeas));
      localStorage.setItem('freshlog_shopping', JSON.stringify(next.shoppingList));

      if (commit) {
        setPast(p => [...p, prev]);
        setFuture([]);
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast(p => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      const newPast = p.slice(0, p.length - 1);

      setState(current => {
        setFuture(f => [current, ...f]);
        
        // Save to localStorage
        localStorage.setItem('freshlog_ingredients', JSON.stringify(previous.ingredients));
        localStorage.setItem('freshlog_mealplan', JSON.stringify(previous.mealPlans));
        localStorage.setItem('freshlog_ideas', JSON.stringify(previous.cookingIdeas));
        localStorage.setItem('freshlog_shopping', JSON.stringify(previous.shoppingList));

        return previous;
      });

      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[0];
      const newFuture = f.slice(1);

      setState(current => {
        setPast(p => [...p, current]);

        // Save to localStorage
        localStorage.setItem('freshlog_ingredients', JSON.stringify(next.ingredients));
        localStorage.setItem('freshlog_mealplan', JSON.stringify(next.mealPlans));
        localStorage.setItem('freshlog_ideas', JSON.stringify(next.cookingIdeas));
        localStorage.setItem('freshlog_shopping', JSON.stringify(next.shoppingList));

        return next;
      });

      return newFuture;
    });
  }, []);

  // Sync refs
  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
  }, [undo, redo]);

  // Global Keydown Listeners for Ctrl+Z and Ctrl+Y (or Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if inside input / textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (key === 'z') {
          if (!isInput) {
            e.preventDefault();
            undoRef.current();
          }
        } else if (key === 'y') {
          if (!isInput) {
            e.preventDefault();
            redoRef.current();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'z') {
        if (!isInput) {
          e.preventDefault();
          redoRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    state,
    past,
    future,
    updateState,
    setInitialState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
