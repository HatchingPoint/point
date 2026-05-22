import { SettingsForm } from "../../../components/SettingsForm";

const defaultSettings = {
  workspaceName: "Acme",
  notificationsEnabled: true,
  theme: "light",
};

export default function SettingsPage() {
  return (
    <section>
      <h1>Settings</h1>
      <p>Manage workspace preferences</p>
      <SettingsForm settings={defaultSettings} onSettingsChange={() => undefined} />
    </section>
  );
}
