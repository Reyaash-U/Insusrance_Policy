import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { selectIsAuthenticated, selectIsLoading } from "./store/authSlice.js";
import { useNotifications } from "./context/NotificationContext.jsx";
import AppRouter from "./routes/AppRouter.jsx";
import Navbar    from "./components/common/Navbar.jsx";
import Sidebar   from "./components/common/Sidebar.jsx";
import Loader    from "./components/common/Loader.jsx";

const AUTH_ROUTES = ["/login", "/register", "/verify-email"];

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
  exit:    { opacity: 0,       transition: { duration: 0.1 } },
};

const App = () => {
  const location        = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading       = useSelector(selectIsLoading);
  const { fetchNotifications } = useNotifications();
  const isAuthPage      = AUTH_ROUTES.includes(location.pathname);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated, fetchNotifications]);

  if (isLoading) return <Loader fullScreen />;

  if (isAuthPage || !isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} {...pageVariants}>
          <AppRouter />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(135deg, #eef2ff 0%, #faf5ff 40%, #f0fdfa 100%)" }}>
      {/* Soft ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 left-1/3 w-[360px] h-[360px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)" }} />
        <div className="bg-grid absolute inset-0" />
      </div>

      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="p-6 min-h-full"
              {...pageVariants}
            >
              <AppRouter />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;
