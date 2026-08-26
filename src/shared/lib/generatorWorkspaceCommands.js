export const GENERATOR_WORKSPACE_COMMAND_EVENT = 'nocreport:generator-command';

export const GENERATOR_WORKSPACE_COMMANDS = Object.freeze({
  COPY_REPORT: 'copy_report',
  FOCUS_SMART_IMPORT: 'focus_smart_import',
  FOCUS_PROGRESS: 'focus_progress',
  FOCUS_VALIDATION: 'focus_validation',
});

const COMMAND_SET = new Set(Object.values(GENERATOR_WORKSPACE_COMMANDS));

export function isGeneratorWorkspaceCommand(value) {
  return COMMAND_SET.has(value);
}

export function isGeneratorWorkspacePath(pathname) {
  return /^\/generator(?:\/|$)/.test(String(pathname ?? ''));
}

export function dispatchGeneratorWorkspaceCommand(command, target = globalThis.window) {
  if (!isGeneratorWorkspaceCommand(command) || !target?.dispatchEvent) return false;
  target.dispatchEvent(
    new CustomEvent(GENERATOR_WORKSPACE_COMMAND_EVENT, {
      detail: { command },
    }),
  );
  return true;
}
