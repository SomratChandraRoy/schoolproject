Getting Started

Let’s build a basic, scrollable PDF viewer. This guide will walk you through the essential setup.

1. Installation

You’ll need a few packages to create a minimal viewer: the core library, the engine, and a few essential plugins.

npm install @embedpdf/core @embedpdf/engines @embedpdf/plugin-document-manager @embedpdf/plugin-viewport @embedpdf/plugin-scroll @embedpdf/plugin-render

2. Create Your Viewer Component

The core of your viewer will be the <EmbedPDF> component, which manages the engine and plugins.

Here is a minimal PDFViewer component that loads a document from a URL and renders it in a vertically scrollable viewport.

PDFViewer.tsx

import { createPluginRegistration } from '@embedpdf/core';import { EmbedPDF } from '@embedpdf/core/react';import { usePdfiumEngine } from '@embedpdf/engines/react'; // Import the essential pluginsimport { Viewport, ViewportPluginPackage } from '@embedpdf/plugin-viewport/react';import { Scroller, ScrollPluginPackage } from '@embedpdf/plugin-scroll/react';import {  DocumentContent,  DocumentManagerPluginPackage,} from '@embedpdf/plugin-document-manager/react';import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/react'; // 1. Register the plugins you needconst plugins = [  createPluginRegistration(DocumentManagerPluginPackage, {    initialDocuments: [{ url: 'https://snippet.embedpdf.com/ebook.pdf' }],  }),  createPluginRegistration(ViewportPluginPackage),  createPluginRegistration(ScrollPluginPackage),  createPluginRegistration(RenderPluginPackage),]; export const PDFViewer = () => {  // 2. Initialize the engine with the React hook  const { engine, isLoading } = usePdfiumEngine();   if (isLoading || !engine) {    return <div>Loading PDF Engine...</div>;  }   // 3. Wrap your UI with the <EmbedPDF> provider  return (    <div style={{ height: '500px' }}>      <EmbedPDF engine={engine} plugins={plugins}>        {({ activeDocumentId }) =>          activeDocumentId && (            <DocumentContent documentId={activeDocumentId}>              {({ isLoaded }) =>                isLoaded && (                  <Viewport                    documentId={activeDocumentId}                    style={{                      backgroundColor: '#f1f3f5',                    }}                  >                    <Scroller                      documentId={activeDocumentId}                      renderPage={({ width, height, pageIndex }) => (                        <div style={{ width, height }}>                          {/* The RenderLayer is responsible for drawing the page */}                          <RenderLayer                            documentId={activeDocumentId}                            pageIndex={pageIndex}                          />                        </div>                      )}                    />                  </Viewport>                )              }            </DocumentContent>          )        }      </EmbedPDF>    </div>  );};

3. Render Your Component

Finally, add your new PDFViewer component to your main application file.

App.tsx

import { PDFViewer } from './PDFViewer'; function App() {  return <PDFViewer />;} export default App;

Interactive Example

When you run the code above, it will produce a functional, scrollable PDF viewer like the one shown here:

View Code80 lines

You now have a functional PDF viewer!

Next Steps

Discover how to add more features by Understanding Plugins.

Understanding Plugins
Plugins are the heart of EmbedPDF’s headless architecture. They are modular packages that add specific features and capabilities to your core viewer. This à la carte approach ensures your application remains lean, loading only the functionality you actually need.

Think of the <EmbedPDF> component as a smartphone: it’s powerful on its own, but it’s the apps (plugins) you install that give it new features like navigation, social media, or games.

How Plugins Work
Adding a new feature to your viewer follows a simple three-step process:

1. Install the Plugin Package
Each plugin is its own NPM package. For example, to add zooming capabilities, you would install the zoom plugin:

npm install @embedpdf/plugin-zoom
2. Register the Plugin
Next, you import the plugin’s ...PluginPackage and register it in the plugins array that you pass to the <EmbedPDF> component. This is done using the createPluginRegistration helper function.

PDFViewer.tsx
import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react';
import { ZoomPluginPackage, ZoomMode } from '@embedpdf/plugin-zoom/react';
 
const plugins = [
  // ... other essential plugins like DocumentManager, Viewport, etc.
  createPluginRegistration(DocumentManagerPluginPackage, {
    initialDocuments: [{ url: 'https://snippet.embedpdf.com/ebook.pdf' }],
  }),
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
 
  // Add the zoom plugin to the array
  createPluginRegistration(ZoomPluginPackage, {
    defaultZoomLevel: ZoomMode.FitPage, // You can pass options here!
  }),
];
 
// ... rest of your component
Registering the plugin activates its core logic and makes its features available to the rest of your application.

3. Use the Plugin’s Components and Hooks
Once a plugin is registered, you can use its associated React components and hooks to build your UI. For example, the zoom plugin provides a <MarqueeZoom /> component for drag-to-zoom functionality and a useZoom hook to control zoom levels from a toolbar.

Since EmbedPDF supports multiple documents, hooks and components require a documentId parameter to know which document they’re working with. You’ll get the activeDocumentId from the <EmbedPDF> component’s children function.

ZoomToolbar.tsx
import { useZoom } from '@embedpdf/plugin-zoom/react';
 
interface ZoomToolbarProps {
  documentId: string;
}
 
export const ZoomToolbar = ({ documentId }: ZoomToolbarProps) => {
  const { provides: zoomProvides, state: zoomState } = useZoom(documentId);
 
  if (!zoomProvides) {
    return null;
  }
 
  return (
    <div>
      <span>Current Zoom: {Math.round(zoomState.currentZoomLevel * 100)}%</span>
      <button onClick={zoomProvides.zoomOut}>-</button>
      <button onClick={zoomProvides.zoomIn}>+</button>
      <button onClick={() => zoomProvides.requestZoom(1.0)}>Reset</button>
    </div>
  );
};
This clear separation of logic (the plugin) from the view (your components) gives you complete control over your UI.

4. Add the Component to Your Viewer
Finally, import and place your new <ZoomToolbar /> component inside the <EmbedPDF> provider. This is essential, as it allows the useZoom hook to access the context provided by the ZoomPluginPackage.

Since we’re working with multiple documents, you’ll need to:

Get the activeDocumentId from the <EmbedPDF> children function
Use <DocumentContent> to ensure the document is loaded before rendering
Pass the documentId to all components and hooks that need it
PDFViewer.tsx
import { EmbedPDF } from '@embedpdf/core/react';
// ... other imports
import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
import { Viewport } from '@embedpdf/plugin-viewport/react';
import { Scroller } from '@embedpdf/plugin-scroll/react';
import { RenderLayer } from '@embedpdf/plugin-render/react';
import { ZoomToolbar } from './ZoomToolbar'; // 1. Import the toolbar
 
// ... plugins array and PDFViewer component setup
export const PDFViewer = () => {
  // ...
  return (
    <div style={{ height: '500px', border: '1px solid black', display: 'flex', flexDirection: 'column' }}>
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ activeDocumentId }) =>
          activeDocumentId && (
            <DocumentContent documentId={activeDocumentId}>
              {({ isLoaded }) =>
                isLoaded && (
                  <div style={{display: 'flex', height: '100%', flexDirection: 'column'}}>
                    <ZoomToolbar documentId={activeDocumentId} /> {/* 2. Add the component here with documentId */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <Viewport documentId={activeDocumentId}>
                        <Scroller
                          documentId={activeDocumentId}
                          renderPage={({ width, height, pageIndex }) => (
                            <div style={{ width, height }}>
                              <RenderLayer
                                documentId={activeDocumentId}
                                pageIndex={pageIndex}
                              />
                            </div>
                          )}
                        />
                      </Viewport>
                    </div>
                  </div>
                )
              }
            </DocumentContent>
          )
        }
      </EmbedPDF>
    </div>
  );
};
5. Live Demo
This is the result of the code above—a fully functional PDF viewer with zoom controls that you built from the ground up.

Zoom

61%


Reset







View Code
161 lines
Types of Plugin Features
Plugins can provide several types of tools:

Core Logic: Some plugins work entirely in the background to manage state (e.g., ScrollPluginPackage).
React Components: Most plugins offer functional components that you place in your viewer to add UI features (e.g., <RenderLayer />, <SelectionLayer />, <MarqueeZoom />).
React Hooks: Functions like useZoom(documentId) or useSearch(documentId) allow your custom components to access plugin data and trigger actions. Since EmbedPDF supports multiple documents, these hooks require a documentId parameter.
By combining plugins, you can compose a feature-rich PDF experience that is perfectly tailored to your application’s design and needs.

Last updated on December 20, 2025
Getting Started
Full Example: MUI Viewer
Need Help?


Docs
React
Full Example: MUI Viewer
Full Example: React MUI PDF Viewer
While the previous guides show how to use individual plugins, it’s often helpful to see how they all come together in a complete application. This page showcases a feature-rich, responsive PDF viewer built with EmbedPDF and Material-UI.

This example serves as a practical blueprint, demonstrating how to build a polished and cohesive user experience by combining EmbedPDF’s headless components with a popular UI library.

Live Demo: mui.embedpdf.com
Source Code: View on GitHub
This example is a great starting point for your own project. Feel free to fork the repository and adapt the code to fit your needs.

Features Showcase
The MUI example integrates numerous plugins to create a comprehensive viewing experience.

Feature	Plugin(s) Used
Virtualized scrolling with smooth page rendering	@embedpdf/plugin-scroll & @embedpdf/plugin-render
Advanced zoom controls (presets, fit-to-page, marquee)	@embedpdf/plugin-zoom
Pan/hand tool for easy navigation	@embedpdf/plugin-pan
Page rotation in 90-degree increments	@embedpdf/plugin-rotate
Single and two-page spread layouts	@embedpdf/plugin-spread
Thumbnail sidebar for quick page jumping	@embedpdf/plugin-thumbnail
In-document text search with result highlighting	@embedpdf/plugin-search
File opening and downloading	@embedpdf/plugin-document-manager & @embedpdf/plugin-export
Fullscreen mode	@embedpdf/plugin-fullscreen
Text selection and copy-to-clipboard	@embedpdf/plugin-selection
Core Concepts Illustrated
1. Centralized Plugin Registration
All features are enabled and configured in a single plugins array. This makes it easy to see what capabilities the viewer has and to add or remove features.

src/application.tsx
const plugins = [
  createPluginRegistration(DocumentManagerPluginPackage, { /* ... */ }),
  createPluginRegistration(ViewportPluginPackage, { /* ... */ }),
  createPluginRegistration(ScrollPluginPackage, { /* ... */ }),
  createPluginRegistration(RenderPluginPackage),
  createPluginRegistration(TilingPluginPackage, { /* ... */ }),
  createPluginRegistration(ZoomPluginPackage, { /* ... */ }),
  createPluginRegistration(SearchPluginPackage),
  createPluginRegistration(InteractionManagerPluginPackage),
  createPluginRegistration(PanPluginPackage),
  createPluginRegistration(RotatePluginPackage),
  createPluginRegistration(SpreadPluginPackage),
  createPluginRegistration(FullscreenPluginPackage),
  createPluginRegistration(ExportPluginPackage),
  createPluginRegistration(ThumbnailPluginPackage),
  createPluginRegistration(SelectionPluginPackage),
];
 
function App() {
  // ...
  return (
    <EmbedPDF engine={engine} plugins={plugins}>
      {({ activeDocumentId }) =>
        activeDocumentId && (
          <DocumentContent documentId={activeDocumentId}>
            {({ isLoaded }) =>
              isLoaded && (
                <>
                  <Toolbar documentId={activeDocumentId} />
                  <Viewport documentId={activeDocumentId}>
                    {/* Viewer UI with documentId passed to components */}
                  </Viewport>
                </>
              )
            }
          </DocumentContent>
        )
      }
    </EmbedPDF>
  );
}
2. Composable UI Components
The UI is broken down into logical, reusable components (<Toolbar />, <Sidebar />, <Search />, etc.). Each component is responsible for a specific piece of the UI and uses EmbedPDF hooks to interact with the relevant plugins.

For example, the <Toolbar /> component uses multiple hooks to manage different functionalities like panning, rotating, and changing the page layout.

src/components/toolbar/index.tsx
import { usePan } from '@embedpdf/plugin-pan/react';
import { useRotate } from '@embedpdf/plugin-rotate/react';
import { useSpread } from '@embedpdf/plugin-spread/react';
// ... other imports
 
interface ToolbarProps {
  documentId: string;
}
 
export const Toolbar = ({ documentId }: ToolbarProps) => {
  const { provides: panProvider, isPanning } = usePan(documentId);
  const { provides: rotateProvider } = useRotate(documentId);
  const { spreadMode, provides: spreadProvider } = useSpread(documentId);
  // ...
 
  return (
    <AppBar>
      <MuiToolbar>
        {/* ... */}
        <ToggleIconButton isOpen={isPanning} onClick={() => panProvider?.togglePan()}>
          <BackHandOutlinedIcon />
        </ToggleIconButton>
        {/* ... other buttons for rotate, spread, etc. */}
      </MuiToolbar>
    </AppBar>
  );
};
3. Responsive Design
The example uses MUI’s built-in responsive utilities and a custom useIsMobile hook to adapt the layout for smaller screens. On mobile, sidebars collapse into a bottom sheet, and some toolbar icons are hidden to save space, providing a more native-like experience.

Running the Example Locally
You can run the full MUI example on your machine to experiment with the code.

Prerequisites: You’ll need Node.js 18+ and pnpm.

1. Clone the repository:
git clone https://github.com/embedpdf/embed-pdf-viewer.git
cd embed-pdf-viewer
2. Install dependencies:
pnpm install
3. Build the core packages
The example imports the core EmbedPDF packages from the local workspace. You need to build them once.

pnpm run build --filter "./packages/*"
4. Run the example’s dev server:
pnpm --filter @embedpdf/example-react-mui run dev
Vite will start the development server, and you can access the viewer at http://localhost:3000.

Last updated on December 20, 2025
Understanding Plugins
Engine


PDFium Engine for React
The usePdfiumEngine hook is the bridge between the core PDF processing engine and your React application. Its primary purpose is to provide a managed engine instance for the main <EmbedPDF> component, which then orchestrates all the plugins and UI components.

Installation
The hook is included in the @embedpdf/engines package, which should be installed alongside @embedpdf/core.

npm install @embedpdf/core @embedpdf/engines
Primary Use Case: Powering the <EmbedPDF> Component
Most of the time, you will simply get the engine from the hook and pass it to the <EmbedPDF> provider. The provider and its plugins will handle the rest.

This pattern allows you to build your entire viewer without ever calling engine.openDocument() or engine.renderPage() yourself.

MyViewer.tsx
import { usePdfiumEngine } from '@embedpdf/engines/react';
import { EmbedPDF } from '@embedpdf/core/react';
// ... import your desired plugins and components
 
function MyViewer() {
  const { engine, isLoading, error } = usePdfiumEngine();
 
  if (isLoading) {
    return <div>Loading PDF Engine...</div>;
  }
  if (error) {
    return <div>Error loading engine: {error.message}</div>;
  }
  
  // The engine is ready and initialized. Pass it to the provider.
  return (
    <EmbedPDF engine={engine} plugins={/* ... your plugins ... */}>
      {/* ... your viewer components like <Viewport />, <Toolbar />, etc. ... */}
    </EmbedPDF>
  );
}
Alternative: Using the Engine Provider Directly
For more advanced use cases or when you need to share the engine across multiple components, you can use the PdfEngineProvider directly:

AppWithProvider.tsx
import { usePdfiumEngine, PdfEngineProvider } from '@embedpdf/engines/react';
import { EmbedPDF } from '@embedpdf/core/react';
 
function App() {
  const { engine, isLoading, error } = usePdfiumEngine();
 
  return (
    <PdfEngineProvider engine={engine} isLoading={isLoading} error={error}>
      <MyViewerComponent />
      <SomeOtherComponent />
    </PdfEngineProvider>
  );
}
 
function MyViewerComponent() {
  const { engine, isLoading, error } = useEngineContext();
  
  if (isLoading) {
    return <div>Loading PDF Engine...</div>;
  }
  if (error) {
    return <div>Error loading engine: {error.message}</div>;
  }
 
  return (
    <EmbedPDF engine={engine} plugins={/* ... your plugins ... */}>
      {/* ... your viewer components ... */}
    </EmbedPDF>
  );
}
Advanced Use Case: Direct Engine Interaction
For tasks that fall outside the plugin system—such as exporting a page image on a button click or performing a one-off text extraction—you can use the engine object directly.

import { usePdfiumEngine } from '@embedpdf/engines/react'
import { ignore } from '@embedpdf/models'
 
export default function DirectEngineExample() {
  const { isLoading, error, engine } = usePdfiumEngine()
 
  if (error) {
    return (
      <div className="mt-3 rounded-md bg-red-50 p-4 text-sm font-medium text-red-800">
        Failed to initialize PDF engine: {error.message}
      </div>
    )
  }
 
  if (isLoading || !engine) {
    return (
      <div className="mt-3 rounded-md bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
        Loading PDF engine...
      </div>
    )
  }
 
  // Engine is ready to use directly
  const handleDirectOperation = () => {
    // Example: You can now use engine methods directly
    console.log('Engine is ready for direct operations');
  };
 
  return (
    <div className="mt-3 rounded-md bg-green-50 p-4 text-sm font-medium text-green-800">
      <p>Engine loaded successfully!</p>
      <button onClick={handleDirectOperation}>Perform Direct Operation</button>
    </div>
  )
}
Hook API Reference
The usePdfiumEngine hook accepts an optional configuration object and returns the engine’s state.

Configuration Options
Option	Type	Default	Description
wasmUrl	string	CDN URL	Custom WebAssembly file URL
worker	boolean	true	Whether to run the engine in a Web Worker
logger	Logger	undefined	Custom logger instance
Return Values
engine: The PdfEngine instance (already initialized), or null while loading.
isLoading: A boolean that is true while the engine’s WebAssembly is being downloaded and instantiated.
error: An Error object if loading or initialization fails, otherwise null.
Provider Components
Component	Description
PdfEngineProvider	Context provider for sharing engine state across components
useEngineContext	Hook to access engine from provider context
useEngine	Simplified hook that returns the engine or throws on error
For complete documentation of all available engine methods, see the @embedpdf/engines package documentation.

Last updated on December 20, 2025
Full Example: MUI Viewer
Document Manager



ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025


ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025


ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025


ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025


ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025


ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025
ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025

ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025
ocument Manager Plugin
The Document Manager Plugin is responsible for managing PDF documents in your viewer. It handles opening documents from URLs or local files, tracking document state (loading, loaded, error), and controlling which document is currently active.

This plugin is required for any PDF viewer, whether you’re displaying a single document or multiple documents. It provides the foundation for document lifecycle management and enables features like tab interfaces for multi-document applications.

Installation
The plugin is available as a separate NPM package.

npm install @embedpdf/plugin-document-manager
Registration
Import DocumentManagerPluginPackage and add it to the plugins array. You can configure initial documents to load automatically when the plugin initializes.

import { createPluginRegistration } from '@embedpdf/core'
import { EmbedPDF } from '@embedpdf/core/react'
// ... other imports
import { DocumentManagerPluginPackage } from '@embedpdf/plugin-document-manager/react'
 
const plugins = [
  // Register the document manager plugin first
  createPluginRegistration(DocumentManagerPluginPackage, {
    // Optional: Load documents automatically on initialization
    initialDocuments: [
      { url: 'https://example.com/document1.pdf' },
      { url: 'https://example.com/document2.pdf' },
    ],
    // Optional: Limit the maximum number of open documents
    maxDocuments: 10,
  }),
  // ... other plugins like Viewport, Scroll, Render, etc.
  createPluginRegistration(ViewportPluginPackage),
  createPluginRegistration(ScrollPluginPackage),
  createPluginRegistration(RenderPluginPackage),
]
Usage
1. Rendering the Active Document
Because the viewer can hold multiple documents in memory (e.g., in background tabs), you need a way to render only the currently active one.

The <DocumentContent /> component handles this logic for you. It takes a documentId and provides a render prop with the document’s status (isLoading, isError, isLoaded).

import { DocumentContent } from '@embedpdf/plugin-document-manager/react';
 
const MainViewerArea = ({ activeDocumentId }) => {
  // If no document is selected, show a placeholder
  if (!activeDocumentId) return <div>No document selected</div>;
 
  return (
    <DocumentContent documentId={activeDocumentId}>
      {({ isLoading, isError, isLoaded }) => (
        <>
          {isLoading && <LoadingSpinner />}
          {isError && <ErrorMessage />}
          
          {/* Only render the heavy viewer components when loaded */}
          {isLoaded && (
             <Viewport documentId={activeDocumentId}>
               {/* ... Scroller, etc ... */}
             </Viewport>
          )}
        </>
      )}
    </DocumentContent>
  );
};
2. Opening Files
The plugin provides methods to open files from URLs or the user’s file system. Use the useDocumentManagerCapability hook to access these actions.

import { useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const OpenButton = () => {
  const { provides: docManager } = useDocumentManagerCapability();
 
  const handleOpenFile = async () => {
    // Opens the native system file picker
    // The plugin handles reading the buffer and creating the document
    await docManager.openFileDialog(); 
  };
 
  const handleOpenUrl = () => {
    docManager.openDocumentUrl({ 
      url: 'https://example.com/report.pdf',
      password: 'optional-password' 
    });
  };
 
  return <button onClick={handleOpenFile}>Open File</button>;
};
3. Building a Tab Bar
To build a multi-document interface, you need to know which documents are open and which one is active. The useOpenDocuments and useActiveDocument hooks provide this reactive state.

import { useOpenDocuments, useActiveDocument, useDocumentManagerCapability } from '@embedpdf/plugin-document-manager/react';
 
const TabBar = () => {
  const documents = useOpenDocuments(); // Array of all open document states
  const { activeDocumentId } = useActiveDocument();
  const { provides: docManager } = useDocumentManagerCapability();
 
  return (
    <div className="tabs">
      {documents.map(doc => (
        <div 
          key={doc.id}
          className={doc.id === activeDocumentId ? 'active' : ''}
          onClick={() => docManager.setActiveDocument(doc.id)}
        >
          {doc.name}
          <button onClick={(e) => {
             e.stopPropagation(); 
             docManager.closeDocument(doc.id);
          }}>x</button>
        </div>
      ))}
    </div>
  );
};
Live Examples
Multi-Document Viewer with Tabs
This example demonstrates a complete PDF viewer with a tab bar for managing multiple documents. You can open multiple PDFs, switch between them using tabs, and close documents.

ebook.pdf

ebook.pdf









View Code
240 lines
Password-Protected Document
This example shows how to handle password-protected documents. When you open a protected PDF, you’ll be prompted to enter the password. The example demonstrates detecting password errors, retrying with a password, and handling incorrect password attempts.

Try entering an incorrect password first to see the error handling, then enter the correct password (the password is “embedpdf”) to open the document.

Password Required
demo_protected.pdf


This document is protected. Enter the password to view it.

Password
Enter password

Cancel
Unlock

View Code
240 lines
API Reference
Configuration (DocumentManagerPluginConfig)
You can pass these options when registering the plugin with createPluginRegistration:

Option	Type	Description
initialDocuments	InitialDocumentOptions[]	An array of documents to load automatically when the plugin initializes. Each item can be either { url: string, documentId?: string, ... } or { buffer: ArrayBuffer, name: string, documentId?: string, ... }.
maxDocuments	number	The maximum number of documents that can be open simultaneously. If not specified, there is no limit.
Hook: useDocumentManagerCapability()
This hook provides access to all document management operations.

Returns
Property	Type	Description
provides	DocumentManagerCapability | null	An object with methods to manage documents, or null if the plugin is not ready.
DocumentManagerCapability Methods
Method	Description
openDocumentUrl(options)	Opens a document from a URL. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openDocumentBuffer(options)	Opens a document from an ArrayBuffer. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
openFileDialog(options?)	Opens the browser’s native file picker. Returns a Task<OpenDocumentResponse, PdfErrorReason>.
closeDocument(documentId)	Closes a specific document. Returns a Task<void, PdfErrorReason>.
closeAllDocuments()	Closes all open documents. Returns a Task<void[], PdfErrorReason>.
setActiveDocument(documentId)	Sets the active document. Throws an error if the document is not open.
getActiveDocumentId()	Returns the ID of the currently active document, or null if none.
getActiveDocument()	Returns the PdfDocumentObject of the active document, or null if none.
getDocumentOrder()	Returns an array of document IDs in their current tab order.
moveDocument(documentId, toIndex)	Moves a document to a specific position in the tab order.
swapDocuments(documentId1, documentId2)	Swaps the positions of two documents in the tab order.
getDocument(documentId)	Returns the PdfDocumentObject for a specific document, or null if not found.
getDocumentState(documentId)	Returns the DocumentState for a specific document, or null if not found.
getOpenDocuments()	Returns an array of all open DocumentState objects in tab order.
isDocumentOpen(documentId)	Returns true if the document is currently open.
getDocumentCount()	Returns the number of currently open documents.
getDocumentIndex(documentId)	Returns the index of a document in the tab order, or -1 if not found.
retryDocument(documentId, options?)	Retries loading a document that failed to load (e.g., with a new password). Returns a Task<OpenDocumentResponse, PdfErrorReason>.
Hook: useActiveDocument()
A convenience hook for accessing the active document.

Returns
Property	Type	Description
activeDocumentId	string | null	The ID of the currently active document.
activeDocument	DocumentState | null	The state of the currently active document.
Hook: useOpenDocuments(documentIds?)
A hook for accessing all open documents.

Returns
Property	Type	Description
documentStates	DocumentState[]	An array of all open documents in tab order. If documentIds is provided, returns only those documents in the specified order.
Component: <DocumentContent />
A headless component that provides loading, error, and loaded states for a specific document.

Props
Prop	Type	Description
documentId	string | null	(Required) The ID of the document to render content for.
children	(props: DocumentContentRenderProps) => ReactNode	(Required) A render prop function that receives document state information.
DocumentContentRenderProps
Property	Type	Description
documentState	DocumentState	The full state object for the document.
isLoading	boolean	true if the document is currently loading.
isError	boolean	true if the document failed to load.
isLoaded	boolean	true if the document has loaded successfully.
Events
The plugin emits events that you can subscribe to for reacting to document lifecycle changes:

Event	Type	Description
onDocumentOpened	EventHook<DocumentState>	Emitted when a document is successfully loaded.
onDocumentClosed	EventHook<string>	Emitted when a document is closed. The payload is the document ID.
onActiveDocumentChanged	EventHook<DocumentChangeEvent>	Emitted when the active document changes.
onDocumentOrderChanged	EventHook<DocumentOrderChangeEvent>	Emitted when documents are reordered.
onDocumentError	EventHook<DocumentErrorEvent>	Emitted when a document fails to load.
Last updated on December 20, 2025