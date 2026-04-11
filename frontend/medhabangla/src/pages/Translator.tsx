/**
 * Translator Page
 * English-Bangla translator with offline support
 */

import React from "react";
import { Translator } from "../components/Translator";

const TranslatorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Translator />
    </div>
  );
};

export default TranslatorPage;
