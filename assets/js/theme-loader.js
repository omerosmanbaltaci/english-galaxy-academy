/* ==========================================================================
   English Galaxy Academy - Global Theme Loader
   Fetches the active theme from the server and applies CSS variables before 
   the page paints to minimize Flash of Unstyled Content (FOUC).
   ========================================================================== */

(async function() {
    try {
        const res = await fetch('/api/theme?t=' + new Date().getTime(), { cache: 'no-store' });
        if (res.ok) {
            const theme = await res.json();
            if (theme && Object.keys(theme).length > 0) {
                const root = document.documentElement;
                for (const [key, value] of Object.entries(theme)) {
                    // Injecting variables into :root
                    root.style.setProperty(`--${key}`, value);
                }
            }
        }
    } catch (err) {
        console.error("Failed to load global theme:", err);
    }
})();
