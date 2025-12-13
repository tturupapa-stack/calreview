"use client";

import { useEffect } from "react";
import { initGA } from "@/lib/analytics";

export function AnalyticsProvider() {
  useEffect(() => {
    initGA();
  }, []);

  return null;
}

