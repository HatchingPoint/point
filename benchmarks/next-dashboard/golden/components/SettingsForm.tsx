"use client";

import type { WorkspaceSettings } from "../lib/types";

type SettingsFormProps = {
  settings: WorkspaceSettings;
  onSettingsChange: (settings: WorkspaceSettings) => void;
};

export function SettingsForm({ settings, onSettingsChange }: SettingsFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <label>
        Workspace name
        <input
          value={settings.workspaceName}
          onChange={(event) => onSettingsChange({ ...settings, workspaceName: event.target.value })}
        />
      </label>
      <label>
        Email notifications
        <input
          type="checkbox"
          checked={settings.notificationsEnabled}
          onChange={(event) =>
            onSettingsChange({ ...settings, notificationsEnabled: event.target.checked })
          }
        />
      </label>
      <p>Theme: {settings.theme}</p>
    </form>
  );
}
