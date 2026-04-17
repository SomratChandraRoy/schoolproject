import { env } from "node:process";
import React from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

const TldrawPage: React.FC = () => {
  const licenceKey = env.TLDRAW_LICENSE_KEY || "free";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        width: "100vw",
        height: "100vh",
      }}>
      <Tldraw licenseKey={licenceKey} persistenceKey="sopna-tldraw-board" autoFocus />
    </div>
  );
};

export default TldrawPage;
