import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useData } from "../../context/DataContext";
import type { AvailablePeriod } from "../../types";

// ─── Short month names ────────────────────────────────────────────────────────

const SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const shortLabel = (p: AvailablePeriod) => `${SHORT[p.month - 1]} ${p.year}`;

// ─── URL helpers ──────────────────────────────────────────────────────────────

const pushURL = (period: { year: number; month: number } | null) => {
  const params = new URLSearchParams(window.location.search);
  if (!period) { params.delete("year"); params.delete("month"); }
  else { params.set("year", String(period.year)); params.set("month", String(period.month)); }
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 7px;
  padding: 3px;
`;

const ArrowBtn = styled.button<{ $disabled?: boolean }>`
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: ${({ $disabled }) => $disabled ? "#D1D5DB" : "#6B7280"};
  cursor: ${({ $disabled }) => $disabled ? "default" : "pointer"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  border-radius: 5px;
  font-family: inherit;
  transition: background 0.12s;
  &:hover { background: ${({ $disabled }) => $disabled ? "transparent" : "#E5E7EB"}; }
`;

const PeriodTab = styled.button<{ $active?: boolean }>`
  padding: 0.24rem 0.72rem;
  border: 1px solid ${({ $active }) => $active ? "#D1D5DB" : "transparent"};
  border-radius: 5px;
  font-size: 0.73rem;
  font-weight: ${({ $active }) => $active ? 700 : 400};
  cursor: pointer;
  background: ${({ $active }) => $active ? "white" : "transparent"};
  color: ${({ $active }) => $active ? "#111827" : "#6B7280"};
  box-shadow: ${({ $active }) => $active ? "0 1px 3px rgba(0,0,0,0.07)" : "none"};
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.12s, color 0.12s;
  &:hover { background: ${({ $active }) => $active ? "white" : "#EAECEF"}; color: ${({ $active }) => $active ? "#111827" : "#374151"}; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const VISIBLE = 4;

const PeriodSelector: React.FC = () => {
  const { availablePeriods, filters, setPeriod } = useData();
  const [offset, setOffset] = useState(0);

  // Whenever periods load, jump to show the most recent ones
  useEffect(() => {
    if (availablePeriods.length > 0) {
      setOffset(Math.max(0, availablePeriods.length - VISIBLE));
    }
  }, [availablePeriods.length]);

  const canPrev = offset > 0;
  const canNext = offset + VISIBLE < availablePeriods.length;
  const visible  = availablePeriods.slice(offset, offset + VISIBLE);

  const currentVal = filters.selectedPeriod
    ? `${filters.selectedPeriod.year}-${filters.selectedPeriod.month}`
    : "all";

  const handleSelect = (p: AvailablePeriod) => {
    const period = { year: p.year, month: p.month };
    setPeriod(period);
    pushURL(period);
  };

  if (!availablePeriods.length) return null;

  return (
    <Wrap aria-label="Seleccionar período">
      <ArrowBtn
        $disabled={!canPrev}
        onClick={() => canPrev && setOffset(o => o - 1)}
        title="Período anterior"
        aria-label="Período anterior"
      >
        ‹
      </ArrowBtn>

      {visible.map(p => {
        const val = `${p.year}-${p.month}`;
        return (
          <PeriodTab
            key={val}
            $active={currentVal === val}
            onClick={() => handleSelect(p)}
            title={p.label}
            aria-pressed={currentVal === val}
          >
            {shortLabel(p)}
          </PeriodTab>
        );
      })}

      <ArrowBtn
        $disabled={!canNext}
        onClick={() => canNext && setOffset(o => o + 1)}
        title="Período siguiente"
        aria-label="Período siguiente"
      >
        ›
      </ArrowBtn>
    </Wrap>
  );
};

export default PeriodSelector;
