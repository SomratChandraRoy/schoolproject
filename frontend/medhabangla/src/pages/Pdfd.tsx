import { PDFViewer } from '@embedpdf/react-pdf-viewer';
 
export default function Pdfd() {
  return (
    <div style={{ height: '1000000vh' }}>
      <PDFViewer 
        config={{
          src: 'https://pdfobject.com/pdf/sample.pdf',
          theme: { preference: 'dark' }
        }}
      />
    </div>
  );
}