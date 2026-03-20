import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ className = "" }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className={`inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors group ${className}`}
    >
      <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
      Back
    </button>
  );
};

export default BackButton;
