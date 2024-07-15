"use client"

import { useEffect, useRef } from "react";

export const useInterval = (callback: () => unknown, delay = 100) => {
    const savedCallback = useRef<() => unknown>();
  
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    useEffect(() => {
      function tick() {
        savedCallback.current?.();
      }
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }, [delay]);
  };