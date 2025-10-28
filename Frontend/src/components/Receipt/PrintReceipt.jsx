import React, { useRef } from "react";
import { Printer, Download, Eye } from "lucide-react";
import ReceiptTemplate from "./ReceiptTemplate";
import Modal from "../UI/Modal";

const PrintReceipt = ({ receipt, isOpen, onClose, type = "token" }) => {
  const componentRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printContent = componentRef.current.innerHTML;

    const printStyles = `
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        .receipt-template {
          width: 210mm !important;
          height: 297mm !important;
          margin: 0 !important;
          padding: 15mm !important;
          box-sizing: border-box !important;
          font-size: 11px !important;
          page-break-after: always;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .receipt-template {
            box-shadow: none !important;
          }
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt?.receiptNo}</title>
          ${printStyles}
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    // For now, we'll use the print functionality
    // In a production app, you might want to use a library like jsPDF
    handlePrint();
  };

  if (!receipt) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Receipt Preview">
      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 no-print">
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn-secondary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </button>
        </div>

        {/* Receipt Preview */}
        <div
          className="border border-gray-300 rounded-lg overflow-hidden"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          <div ref={componentRef}>
            <ReceiptTemplate receipt={receipt} />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-3 rounded-lg no-print">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Printing Instructions:
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Click "Print Receipt" to print on A4 paper</li>
            <li>• Receipt is optimized to fit on a single A4 page</li>
            <li>• Ensure "Print backgrounds" is enabled in your browser</li>
            <li>• Set margins to "None" or "Minimum" for best fit</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default PrintReceipt;
