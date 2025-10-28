import { formatDate } from "../../utils/helpers";
import { numberToWords } from "../../utils/numberToWords";
import { MapPin } from "lucide-react";

const ReceiptTemplate = ({ receipt }) => {
  // Debug: Log the receipt data to see what we're getting
  console.log("ReceiptTemplate received receipt data:", receipt);
  console.log("Receipt type:", receipt?.receiptType);

  // Format receipt number as BR/25-26/0001
  const getReceiptNumber = (receiptNo) => {
    if (!receiptNo) return "BR/25-26/0001";

    // If receiptNo is just a number, format it properly
    if (/^\d+$/.test(receiptNo)) {
      const paddedNumber = receiptNo.padStart(4, "0");
      return `BR/25-26/${paddedNumber}`;
    }

    // If it's already formatted, return as is
    return receiptNo;
  };

  return (
    <>
      <style>
        {`
          @media print {
            .receipt-template {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 15mm !important;
              box-sizing: border-box !important;
              font-size: 12px !important;
              page-break-after: always;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            @page {
              size: A4;
              margin: 0;
            }
            
            body {
              margin: 0;
              padding: 0;
            }
            
            .no-print {
              display: none !important;
            }
          }
          
          @media screen {
            .receipt-template {
              box-shadow: 0 4px 20px rgba(0,0,0,0.15);
              margin: 20px auto;
              background: white;
              padding: 30px;
            }
          }
          
          .company-header {
            text-align: left;
            margin-bottom: 17px;
            
            padding-bottom: 10px;
          }
          
          .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            margin: 0;
          }
          
          .receipt-title {
            text-align: center;
            margin: 17px 0;
          }
          
          .receipt-title h2 {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
          }
          
          .receipt-title h3 {
            font-size: 14px;
            font-weight: bold;
            margin: 5px 0 0 0;
            text-transform: uppercase;
          }
          
          .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #000;
          }
          
          .receipt-table td {
            border: 1px solid #000;
            padding: 8px 10px;
            vertical-align: top;
          }
          
          .receipt-table .label-cell {
            background-color: #f5f5f5;
            font-weight: bold;
            width: 120px;
            font-size: 11px;
          }
          
          .receipt-table .value-cell {
            background-color: white;
            font-size: 11px;
          }
          
          .payment-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #000;
          }
          
          .payment-table th {
            border: 1px solid #000;
            padding: 8px;
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
          }
          
          .payment-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
          }
          
          .payment-header {
            text-align: center;
            font-weight: bold;
            margin: 20px 0 10px 0;
            text-transform: uppercase;
          }
          
          .signature-section {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            width: 250px;
            text-align: center;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            height: 80px;
            margin-bottom: 15px;
          }
          
          .footer-section {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 15px;
          }
          
          .footer-item {
            margin-bottom: 12px;
            font-size: 11px;
            line-height: 1.4;
          }
          
          .footer-label {
            font-weight: bold;
            color: #333;
          }
        `}
      </style>
      <div className="receipt-template">
        {/* Company Header */}
        <div className="company-header">
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <img
              src="/receipt-logo1.jpg"
              alt="Company Logo"
              style={{
                height: "80px",
                width: "auto",
                objectFit: "contain",
              }}
            />
            <h1 className="company-name">
              {receipt.siteName || "Golden City Township"}
            </h1>
          </div>
        </div>

        {/* Receipt Title */}
        <div className="receipt-title">
          <h2>
            {receipt.receiptType === "token"
              ? "TOKEN RECEIPT"
              : "BOOKING RECEIPT"}
          </h2>
          <h3>{receipt.companyName || "Subh Sankalp Estate"}</h3>
        </div>

        {/* Main Receipt Information Table */}
        <table className="receipt-table">
          <tbody>
            <tr>
              <td className="label-cell">Receipt No.</td>
              <td className="value-cell">
                {getReceiptNumber(receipt.receiptNo)}
              </td>
              <td className="label-cell">Date</td>
              <td className="value-cell">{formatDate(receipt.date)}</td>
              {receipt.receiptType === "token" && receipt.tokenExpiryDate && (
                <>
                  <td className="label-cell">Expiry Date</td>
                  <td className="value-cell">
                    {formatDate(receipt.tokenExpiryDate)}
                  </td>
                </>
              )}
            </tr>
            <tr>
              <td className="label-cell">Plot No.</td>
              <td className="value-cell">{receipt.plotVillaNo}</td>
              <td className="label-cell">Plot Size</td>
              <td className="value-cell">{receipt.plotSize} sq yard</td>
              <td className="label-cell">Basic Rate</td>
              <td className="value-cell">
                ₹
                {receipt.basicRate ? receipt.basicRate.toLocaleString() : "N/A"}
                /sq yard
              </td>
            </tr>
            <tr>
              <td className="label-cell">Client Name</td>
              <td
                className="value-cell"
                colSpan={
                  receipt.receiptType === "token" && receipt.tokenExpiryDate
                    ? "5"
                    : "5"
                }
              >
                {receipt.fromName}
              </td>
            </tr>
            <tr>
              <td className="label-cell">Relation Name</td>
              <td className="value-cell">
                {receipt.relationType} {receipt.relationName}
              </td>
              <td className="label-cell">Reference Name</td>
              <td
                className="value-cell"
                colSpan={
                  receipt.receiptType === "token" && receipt.tokenExpiryDate
                    ? "3"
                    : "1"
                }
              >
                {receipt.referenceName || "N/A"}
              </td>
            </tr>
            <tr>
              <td className="label-cell">Client Address</td>
              <td
                className="value-cell"
                colSpan={
                  receipt.receiptType === "token" && receipt.tokenExpiryDate
                    ? "5"
                    : "5"
                }
              >
                {receipt.address}
              </td>
            </tr>
            <tr>
              <td className="label-cell">PAN</td>
              <td className="value-cell">{receipt.panNumber || ""}</td>
              <td className="label-cell">Mobile</td>
              <td
                className="value-cell"
                colSpan={
                  receipt.receiptType === "token" && receipt.tokenExpiryDate
                    ? "3"
                    : "1"
                }
              >
                {receipt.mobile}
              </td>
            </tr>
            <tr>
              <td className="label-cell">AADHAR</td>
              <td
                className="value-cell"
                colSpan={
                  receipt.receiptType === "token" && receipt.tokenExpiryDate
                    ? "5"
                    : "5"
                }
              >
                {receipt.aadharNumber || ""}
              </td>
            </tr>
            <tr>
              <td className="label-cell">Amount</td>
              <td
                className="value-cell"
                colSpan={
                  receipt.receiptType === "token" && receipt.tokenExpiryDate
                    ? "5"
                    : "5"
                }
              >
                ₹
                {receipt.totalAmount > 0
                  ? receipt.totalAmount.toLocaleString()
                  : receipt.amount.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td className="label-cell">Amount (Words)</td>
              <td
                className="value-cell"
                colSpan={
                  receipt.receiptType === "token" && receipt.tokenExpiryDate
                    ? "5"
                    : "5"
                }
              >
                {numberToWords(
                  receipt.totalAmount > 0 ? receipt.totalAmount : receipt.amount
                )}
              </td>
            </tr>
            <tr>
              <td className="label-cell">For</td>
              <td
                className="value-cell"
                colSpan={
                  receipt.receiptType === "token" && receipt.tokenExpiryDate
                    ? "5"
                    : "5"
                }
              >
                {receipt.receiptType === "token" ? "Token" : "Booking"} Plot No.{" "}
                {receipt.plotVillaNo}, {receipt.siteName}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment Received Through Section */}
        <div className="payment-header">Payment Received Through</div>

        <table className="payment-table">
          <thead>
            <tr>
              <th>Payment Mode</th>
              <th>Amount</th>
              <th>Instrument No</th>
              <th>Payment Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CASH</td>
              <td>
                {receipt.cashChecked
                  ? `₹${receipt.amount.toLocaleString()}`
                  : "-NA-"}
              </td>
              <td>-</td>
              <td>{receipt.cashChecked ? formatDate(receipt.date) : "-"}</td>
            </tr>
            <tr>
              <td>CHEQUE</td>
              <td>
                {receipt.chequeChecked
                  ? `₹${receipt.amount.toLocaleString()}`
                  : "-NA-"}
              </td>
              <td>{receipt.chequeNo || "-"}</td>
              <td>{receipt.chequeChecked ? formatDate(receipt.date) : "-"}</td>
            </tr>
            <tr>
              <td>NEFT/IMPS/RTGS</td>
              <td>
                {receipt.rtgsChecked
                  ? `₹${receipt.amount.toLocaleString()}`
                  : "-NA-"}
              </td>
              <td>{receipt.rtgsNeft || "-"}</td>
              <td>{receipt.rtgsChecked ? formatDate(receipt.date) : "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment Receipt Validity Note */}
        <div style={{ fontWeight: "bold", margin: "14px 0px 86px" }}>
          PAYMENT RECEIPT VALID SUBJECT TO CHEQUE REALIZATION
        </div>

        {/* Signature Section */}
        <div className="signature-section">
          <div className="signature-box">
            <div className="signature-line"></div>
            <div>CLIENT SIGNATURE</div>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <div>RECEIVER'S SIGNATURE</div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="footer-section">
          <div className="footer-item">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                marginBottom: "8px",
              }}
            >
              <MapPin
                size={12}
                style={{ marginRight: "5px", marginTop: "2px", flexShrink: 0 }}
              />
              <div>
                <span className="footer-label">Corporate Address:</span> 2/248,
                Vidhya Marg Vishnu Puri, Aligarh, Uttar Pradesh-202001
              </div>
            </div>
          </div>
          <div className="footer-item">
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <MapPin
                size={12}
                style={{ marginRight: "5px", marginTop: "2px", flexShrink: 0 }}
              />
              <div>
                <span className="footer-label">Registered Address:</span> 037UG,
                BUILDERS SCHEME, OMAXE ARCADE GOLF LINK-1, Alpha Greater Noida,
                Noida, Gautam Buddha Nagar, Uttar Pradesh - 201310
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptTemplate;
