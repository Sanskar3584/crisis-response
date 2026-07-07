type ThemeToggleProps = {
    theme: "light" | "dark";
    onToggle: () => void;
    color?: string;
    borderColor?: string;
};

export default function ThemeToggle({
                                        theme,
                                        onToggle,
                                        color = "currentColor",
                                        borderColor = "var(--border)",
                                    }: ThemeToggleProps) {
    const isLight = theme === "light";
    return (
        <button
            onClick={onToggle}
            title={isLight ? "Light mode" : "Dark mode"}
            aria-label={`Theme: ${isLight ? "light" : "dark"} mode. Click to switch.`}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 32,
                margin: 0,
                padding: 0,
                background: "transparent",
                border: `1px solid ${borderColor}`,
                borderRadius: 4,
                color: color,
                cursor: "pointer",
            }}
        >
            {isLight ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                    <line x1="12" y1="20" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="4" y2="12" />
                    <line x1="20" y1="12" x2="22" y2="12" />
                    <line x1="4.9" y1="4.9" x2="6.3" y2="6.3" />
                    <line x1="17.7" y1="17.7" x2="19.1" y2="19.1" />
                    <line x1="4.9" y1="19.1" x2="6.3" y2="17.7" />
                    <line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
                </svg>
            ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
        </button>
    );
}