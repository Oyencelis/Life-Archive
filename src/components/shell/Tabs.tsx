"use client";

import { useState, type ReactNode } from "react";

export interface TabDef {
  key: string;
  label: string;
  count?: number;
  content: ReactNode;
}

export function Tabs({ tabs, ariaLabel }: { tabs: TabDef[]; ariaLabel: string }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div>
      <div className="ed-tabs" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={active === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            className={`ed-tab${active === tab.key ? " ed-tab-active" : ""}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
            {typeof tab.count === "number" && <span className="ed-tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`tabpanel-${tab.key}`}
          aria-labelledby={`tab-${tab.key}`}
          className="ed-tab-panel"
          hidden={active !== tab.key}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
