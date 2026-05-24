export function emitPointThemeModeHelpers(): string[] {
	return [
		'const POINT_THEME_MODE_KEY = "point-theme-mode";',
		"",
		"type PointThemeMode = \"light\" | \"dark\";",
		"",
		"const PointThemeModeContext = React.createContext<{ mode: PointThemeMode; toggleMode: () => void } | null>(null);",
		"",
		"function pointInitialThemeMode(): PointThemeMode {",
		"  if (typeof window === \"undefined\") return \"light\";",
		"  const stored = window.localStorage.getItem(POINT_THEME_MODE_KEY);",
		"  if (stored === \"light\" || stored === \"dark\") return stored;",
		"  return window.matchMedia(\"(prefers-color-scheme: dark)\").matches ? \"dark\" : \"light\";",
		"}",
		"",
		"export function PointThemeShell({ className, enabled, children }: { className: string; enabled: boolean; children: React.ReactNode }): JSX.Element {",
		"  if (!enabled) {",
		"    return <div className={className}>{children}</div>;",
		"  }",
		"  const [mode, setMode] = React.useState<PointThemeMode>(pointInitialThemeMode);",
		"  const toggleMode = React.useCallback(() => {",
		"    setMode((current) => {",
		"      const next: PointThemeMode = current === \"light\" ? \"dark\" : \"light\";",
		"      window.localStorage.setItem(POINT_THEME_MODE_KEY, next);",
		"      return next;",
		"    });",
		"  }, []);",
		"  return (",
		"    <PointThemeModeContext.Provider value={{ mode, toggleMode }}>",
		"      <div className={className} data-point-theme={mode}>",
		"        {children}",
		"      </div>",
		"    </PointThemeModeContext.Provider>",
		"  );",
		"}",
		"",
		"export function pointThemeToggle(style?: string): JSX.Element {",
		"  const context = React.useContext(PointThemeModeContext);",
		"  if (!context) {",
		"    return <button type=\"button\" className=\"point-theme-toggle\" disabled aria-label=\"Theme toggle unavailable\">Theme</button>;",
		"  }",
		"  const { mode, toggleMode } = context;",
		"  const className = [\"point-theme-toggle\", ...(style ?? []).map((modifier) => `point-style-${modifier}`)].join(\" \");",
		"  const label = mode === \"light\" ? \"Switch to dark theme\" : \"Switch to light theme\";",
		"  return (",
		"    <button type=\"button\" className={className} onClick={toggleMode} aria-label={label}>",
		"      {mode === \"light\" ? \"Dark\" : \"Light\"}",
		"    </button>",
		"  );",
		"}",
		"",
	];
}

export function emitThemeShellOpen(className: string, themeToggle: boolean, indent = "  "): string {
	return `${indent}<PointThemeShell className=${JSON.stringify(className)} enabled={${themeToggle ? "true" : "false"}}>`;
}

export function emitThemeShellClose(indent = "  "): string {
	return `${indent}</PointThemeShell>`;
}
