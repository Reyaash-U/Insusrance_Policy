import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NeonButton from "../components/common/NeonButton.jsx";

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.h1
          className="text-[120px] font-bold gradient-text leading-none"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          404
        </motion.h1>
        <p className="text-gray-600 mt-4 text-lg">This dimension doesn't exist.</p>
        <p className="text-gray-400 text-sm mt-2">The page you're looking for has drifted into the void.</p>
        <div className="mt-8">
          <NeonButton variant="purple" onClick={() => navigate(-1)}>← Go Back</NeonButton>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
