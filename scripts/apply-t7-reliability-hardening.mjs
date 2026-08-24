import { readFile, writeFile } from 'node:fs/promises';

const composerPath = 'src/features/ticket-generator/components/ProgressComposer.jsx';
const generatorPath = 'src/features/ticket-generator/pages/TicketGeneratorPage.jsx';
const testPath = 'src/features/ticket-generator/components/ProgressComposer.test.jsx';

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) {
    throw new Error(`Unable to apply ${label}: expected source block was not found.`);
  }
  return source.replace(search, replacement);
}

let composer = await readFile(composerPath, 'utf8');
composer = replaceRequired(
  composer,
  "  const [error, setError] = useState('');\n\n  const submit = () => {\n",
  "  const [error, setError] = useState('');\n  const [submitting, setSubmitting] = useState(false);\n\n  const submit = async () => {\n    if (submitting) return;\n",
  'Progress Composer submitting state',
);
composer = replaceRequired(
  composer,
  `    onAdd({\n      id: createLocalId(),\n      occurredAt: date,\n      text: normalizedText,\n      createdAt: new Date(),\n      createdBy: null,\n    });\n    setText('');\n    setError('');\n  };`,
  `    const entry = {\n      id: createLocalId(),\n      occurredAt: date,\n      text: normalizedText,\n      createdAt: new Date(),\n      createdBy: null,\n    };\n\n    setSubmitting(true);\n    try {\n      const accepted = await onAdd(entry);\n      if (accepted === false) return;\n      setText('');\n      setError('');\n    } finally {\n      setSubmitting(false);\n    }\n  };`,
  'Progress Composer persistence acknowledgement',
);
composer = replaceRequired(
  composer,
  `              submit();`,
  `              void submit();`,
  'Progress Composer keyboard async submit',
);
composer = replaceRequired(
  composer,
  `        <Button className="lg:mb-px" onClick={submit}>\n          Add update\n        </Button>`,
  `        <Button className="lg:mb-px" disabled={submitting} onClick={() => void submit()}>\n          {submitting ? 'Adding…' : 'Add update'}\n        </Button>`,
  'Progress Composer pending button',
);
await writeFile(composerPath, composer, 'utf8');

let generator = await readFile(generatorPath, 'utf8');
generator = replaceRequired(
  generator,
  `    if (localDevelopmentMode || !routeTicketId) {\n      setProgressEntries((current) => [...current, entry]);\n      setProgressDirty(true);\n      return;\n    }\n\n    if (persistPending) return;`,
  `    if (localDevelopmentMode || !routeTicketId) {\n      setProgressEntries((current) => [...current, entry]);\n      setProgressDirty(true);\n      return true;\n    }\n\n    if (persistPending) return false;`,
  'Progress add local/pending acknowledgement',
);
generator = replaceRequired(
  generator,
  `      pushToast({\n        title: 'Progress added',\n        message: 'Timeline update persisted.',\n        tone: 'success',\n      });\n    } catch (error) {\n      pushToast({\n        title: 'Progress not saved',\n        message: persistenceMessage(error, 'The progress update could not be persisted.'),\n        tone: 'error',\n      });\n    } finally {`,
  `      pushToast({\n        title: 'Progress added',\n        message: 'Timeline update persisted.',\n        tone: 'success',\n      });\n      return true;\n    } catch (error) {\n      pushToast({\n        title: 'Progress not saved',\n        message: persistenceMessage(error, 'The progress update could not be persisted.'),\n        tone: 'error',\n      });\n      return false;\n    } finally {`,
  'Progress add persistence result',
);
await writeFile(generatorPath, generator, 'utf8');

const testSource = `import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';\nimport { afterEach, describe, expect, it, vi } from 'vitest';\n\nimport { ProgressComposer } from './ProgressComposer.jsx';\n\nafterEach(() => {\n  cleanup();\n});\n\ndescribe('ProgressComposer persistence acknowledgement', () => {\n  it('keeps the operator draft when persistence reports failure', async () => {\n    const onAdd = vi.fn().mockResolvedValue(false);\n    render(<ProgressComposer onAdd={onAdd} />);\n\n    const input = screen.getByLabelText('Progress update');\n    fireEvent.change(input, { target: { value: 'Team OTW ke lokasi CP' } });\n    fireEvent.click(screen.getByRole('button', { name: 'Add update' }));\n\n    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));\n    await waitFor(() => expect(screen.getByRole('button', { name: 'Add update' })).toBeEnabled());\n    expect(input).toHaveValue('Team OTW ke lokasi CP');\n  });\n\n  it('clears the draft only after persistence succeeds', async () => {\n    const onAdd = vi.fn().mockResolvedValue(true);\n    render(<ProgressComposer onAdd={onAdd} />);\n\n    const input = screen.getByLabelText('Progress update');\n    fireEvent.change(input, { target: { value: 'Link normalization observed' } });\n    fireEvent.click(screen.getByRole('button', { name: 'Add update' }));\n\n    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));\n    await waitFor(() => expect(input).toHaveValue(''));\n  });\n});\n`;

let currentTest = null;
try {
  currentTest = await readFile(testPath, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
if (currentTest !== testSource) await writeFile(testPath, testSource, 'utf8');

console.log('T7 reliability hardening applied: Progress drafts survive failed persistence.');
