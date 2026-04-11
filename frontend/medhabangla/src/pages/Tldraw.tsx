import React from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

const TldrawPage: React.FC = () => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        width: "100vw",
        height: "100vh",
      }}>
      <Tldraw persistenceKey="sopan-tldraw-board" autoFocus />
    </div>
  );
};

export default TldrawPage;
