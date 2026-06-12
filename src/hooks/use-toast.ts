"use client";

// Adapted from the shadcn/ui toast hook.
import * as React from "react";
import type { ToastProps, ToastActionElement } from "@/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type State = { toasts: ToasterToast[] };

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleRemoval(id: string) {
  if (timeouts.has(id)) return;
  const t = setTimeout(() => {
    timeouts.delete(id);
    dispatch({ type: "REMOVE", id });
  }, TOAST_REMOVE_DELAY);
  timeouts.set(id, t);
}

type Action =
  | { type: "ADD"; toast: ToasterToast }
  | { type: "UPDATE"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS"; id?: string }
  | { type: "REMOVE"; id?: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD":
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "UPDATE":
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };
    case "DISMISS": {
      const { id } = action;
      if (id) scheduleRemoval(id);
      else state.toasts.forEach((t) => scheduleRemoval(t.id));
      return {
        toasts: state.toasts.map((t) =>
          id === undefined || t.id === id ? { ...t, open: false } : t,
        ),
      };
    }
    case "REMOVE":
      if (action.id === undefined) return { toasts: [] };
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

type Toast = Omit<ToasterToast, "id">;

function toast(props: Toast) {
  const id = genId();
  const update = (p: ToasterToast) =>
    dispatch({ type: "UPDATE", toast: { ...p, id } });
  const dismiss = () => dispatch({ type: "DISMISS", id });

  dispatch({
    type: "ADD",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return { id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (id?: string) => dispatch({ type: "DISMISS", id }),
  };
}

export { useToast, toast };
