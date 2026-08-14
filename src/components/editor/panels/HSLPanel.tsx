import React from 'react';
import { ColorGradingPanel } from './ColorGradingPanel';
import { AdjustmentSettings, HSLSettings, ToneCurves } from '../../../types/editor';

interface HSLPanelProps {
  adjustments?: AdjustmentSettings;
  hsl: HSLSettings;
  toneCurves?: ToneCurves;
  onChange: (hsl: HSLSettings) => void;
  onUpdateAdjustments?: (adjustments: AdjustmentSettings) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const HSLPanel: React.FC<HSLPanelProps> = ({
  adjustments,
  hsl,
  toneCurves,
  onChange,
  onUpdateAdjustments,
  showToast,
}) => {
  return (
    <ColorGradingPanel
      adjustments={adjustments || ({} as any)}
      hsl={hsl}
      toneCurves={toneCurves}
      onUpdateAdjustments={onUpdateAdjustments || (() => {})}
      onUpdateHSL={onChange}
      showToast={showToast}
    />
  );
};
