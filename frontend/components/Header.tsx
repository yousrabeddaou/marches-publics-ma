"use client";

import { Search, RefreshCw } from "lucide-react";
import { useTransition } from "react";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
}

export function Header({ search, onSearchChange }: Props) {
  return (
    <header className="bg-navy-800 text-white sticky top-0 z-40 border-b border-white/10 shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-base font-bold">
            م
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold leading-tight">Marchés Publics</div>
            <div className="text-xs text-white/50 leading-tight">Maroc</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher par objet, acheteur, référence…"
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-400 focus:bg-white/15 transition-colors"
            />
          </div>
        </div>

        {/* Source link */}
        <a
          href="https://www.marchespublics.gov.ma/pmmp/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors shrink-0"
        >
          <RefreshCw size={13} />
          Source officielle
        </a>
      </div>
    </header>
  );
}
