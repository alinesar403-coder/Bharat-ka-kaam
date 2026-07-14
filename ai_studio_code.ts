// Vite middleware / static asset setup for development and production
const distPath = path.join(process.cwd(), 'dist');
// If a production build is present, serve it directly to ensure lightning-fast responses for scanners like PWABuilder
const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(distPath, 'index.html'));

if (isProduction) {
  console.log("Serving production build from:", distPath);
  app.use(express.static(distPath, { dotfiles: 'allow' }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Asynchronously initialize the Vite dev server for local development
  const setupDevServer = async () => {
    console.log("Starting Vite development server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Fallback for SPA routing in development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const template = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  };

  setupDevServer().catch((err) => {
    console.error("Error setting up Vite dev server:", err);
  });
}

// Only listen locally if we are NOT running on Vercel environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;