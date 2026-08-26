import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SmartPasteParser } from './SmartPasteParser.jsx';

afterEach(() => cleanup());

describe('GEN-F4 Unified Import validation analysis', () => {
  it('publishes the current Import Candidate without applying or persisting it', async () => {
    const onApply = vi.fn();
    const onAnalysisChange = vi.fn();
    render(<SmartPasteParser onApply={onApply} onAnalysisChange={onAnalysisChange} />);

    fireEvent.change(screen.getByLabelText('Existing report'), {
      target: {
        value:
          '*[MANDAU] LINK DOWN [TT : INC-20260826-00000001]*\nOccur Time = 26/08/2026 10:00\nDispatch Time = 26/08/2026 10:10',
      },
    });

    await waitFor(() => {
      const analysis = onAnalysisChange.mock.calls
        .map(([value]) => value)
        .find((value) => value?.candidate?.source?.kind === 'report_text');
      expect(analysis).toBeTruthy();
      expect(analysis.identityResolution).toBeNull();
    });

    expect(onApply).not.toHaveBeenCalled();
  });
});
