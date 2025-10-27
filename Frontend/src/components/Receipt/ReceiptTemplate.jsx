import { formatDate } from "../../utils/helpers";
import { numberToWords } from "../../utils/numberToWords";

const ReceiptTemplate = ({ receipt }) => {
  // Debug: Log the receipt data to see what we're getting
  console.log('ReceiptTemplate received receipt data:', receipt);
  console.log('Receipt type:', receipt?.receiptType);
  
  // All receipts now use 4-digit format after database migration
  const getReceiptNumber = (receiptNo) => {
    return receiptNo || "N/A";
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
              padding: 10mm !important;
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
            }
          }
          
          .professional-header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-bottom: 3px solid #2c3e50;
            padding: 15px;
            margin: -10mm -10mm 15px -10mm;
          }
          
          .receipt-title {
            background: #2c3e50;
            color: white;
            padding: 8px 0;
            text-align: center;
            font-weight: bold;
            margin: 0 -10mm 15px -10mm;
            letter-spacing: 1px;
          }
          
          .info-grid {
            display: grid;
            gap: 12px;
            margin-bottom: 12px;
          }
          
          .info-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .info-row-three {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
          }
          
          .field-group {
            background: #f8f9fa;
            padding: 8px 10px;
            border-radius: 4px;
            border-left: 3px solid #007bff;
          }
          
          .field-label {
            font-size: 10px;
            font-weight: 600;
            color: #495057;
            text-transform: uppercase;
            margin-bottom: 3px;
            letter-spacing: 0.5px;
          }
          
          .field-value {
            font-size: 12px;
            font-weight: 500;
            color: #212529;
            min-height: 16px;
          }
          
          .amount-highlight {
            background: #e8f5e8;
            border-left-color: #28a745 !important;
          }
          
          .amount-value {
            font-size: 14px;
            font-weight: bold;
            color: #28a745;
          }
          
          .payment-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 10px;
            margin: 12px 0;
          }
          
          .terms-section {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 10px;
            margin: 12px 0;
          }
          
          .signature-area {
            display: flex;
            justify-content: space-between;
            align-items: end;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px solid #dee2e6;
          }
          
          .company-signature {
            text-align: right;
            padding: 10px 0;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            width: 200px;
            margin: 20px 0 5px auto;
            padding-top: 5px;
          }
        `}
      </style>
      <div
        className="receipt-template bg-white mx-auto relative"
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
          width: "210mm",
          height: "297mm",
          padding: "12mm",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Header Section */}
        <div>
          {/* Integrated Header with Top Image */}
          <div
            style={{
              marginBottom: "5px",
              paddingBottom: "15px",
            }}
          >
            {/* Top Image - Clear and crisp */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <img
                src="/top.jpg"
                alt="Header"
                className="max-w-full h-auto"
                style={{
                  maxHeight: "140px",
                  width: "auto",
                  display: "block",
                  imageRendering: "crisp-edges",
                }}
              />
            </div>

            {/* Company Information - Clean layout */}
            <div
              style={{
                textAlign: "center",
              }}
            >
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  margin: "0",
                  color: "#000",
                }}
              >
                SUBH SANKALP ESTATE PVT. LTD.
              </h1>
              <div
                style={{ fontSize: "12px", lineHeight: "1.4", color: "#000" }}
              >
                <p style={{ margin: "2px 0" }}>037/UG, BUILDERS SCHEME,</p>
                <p style={{ margin: "2px 0" }}>
                  OMAXE ACRADE GOLF LINK-1, Alpha Greater Noida, Noida,
                </p>
                <p style={{ margin: "2px 0" }}>
                  Gautam Buddha Nagar, Uttar Pradesh - 201310
                </p>
              </div>
            </div>
          </div>

          {/* Receipt Title */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgb(182 162 95) 0%, rgb(198 191 169), rgb(159 150 121) 100%)",

              color: "#000",
              padding: "4px 0",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "18px",
              marginBottom: "20px",
              letterSpacing: "2px",
              border: "2px solid #b8941f",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {receipt.receiptType?.toUpperCase() === 'BOOKING' ? 'BOOKING RECEIPT' : 'TOKEN RECEIPT'}
          </div>

          {/* Main Content */}
          <div
            style={{
              border: "2px solid #000",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            {/* Receipt Info Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div>
                <strong>Receipt No:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "80px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {getReceiptNumber(receipt.receiptNo)}
                </span>
              </div>
              <div>
                <strong>Date:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "100px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {formatDate(receipt.date)}
                </span>
              </div>
              {receipt.receiptType?.toLowerCase() === 'token' && (
                <div>
                  <strong>Token Expiry Date:</strong>
                  <span
                    style={{
                      borderBottom: "1px dotted #000",
                      display: "inline-block",
                      minWidth: "100px",
                      paddingLeft: "8px",
                      fontWeight: "normal",
                    }}
                  >
                    {formatDate(receipt.tokenExpiryDate)}
                  </span>
                </div>
              )}
            </div>

            {/* Customer Info Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div style={{ flex: "1", marginRight: "20px" }}>
                <strong>Customer Name:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "200px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.fromName}
                </span>
              </div>
              <div style={{ flex: "1" }}>
                <strong>D/O:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "200px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.relationName}
                </span>
              </div>
            </div>

            {/* Address Row */}
            <div style={{ marginBottom: "15px" }}>
              <strong>Address:</strong>
              <span
                style={{
                  borderBottom: "1px dotted #000",
                  display: "inline-block",
                  minWidth: "500px",
                  paddingLeft: "8px",
                  fontWeight: "normal",
                }}
              >
                {receipt.address}
              </span>
            </div>

            {/* Mobile and Reference Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div style={{ flex: "1", marginRight: "20px" }}>
                <strong>Mobile Number:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "150px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.mobile}
                </span>
              </div>
              <div style={{ flex: "1" }}>
                <strong>Reference Name:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "180px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.referenceName || "Subh Sankalp Estate"}
                </span>
              </div>
            </div>

            {/* PAN Number and Aadhar Number Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div style={{ flex: "1", marginRight: "20px" }}>
                <strong>PAN Number:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "150px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.panNumber || ""}
                </span>
              </div>
              <div style={{ flex: "1" }}>
                <strong>Aadhar Number:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "180px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.aadharNumber || ""}
                </span>
              </div>
            </div>

            {/* Company Name Row */}
            <div style={{ marginBottom: "15px" }}>
              <strong>Company Name:</strong>
              <span
                style={{
                  borderBottom: "1px dotted #000",
                  display: "inline-block",
                  minWidth: "300px",
                  paddingLeft: "8px",
                  fontWeight: "normal",
                }}
              >
                {receipt.companyName || ""}
              </span>
            </div>

            {/* Site Name Row */}
            <div style={{ marginBottom: "15px" }}>
              <strong>Site Name:</strong>
              <span
                style={{
                  borderBottom: "1px dotted #000",
                  display: "inline-block",
                  minWidth: "450px",
                  paddingLeft: "8px",
                  fontWeight: "normal",
                }}
              >
                {receipt.siteName}
              </span>
            </div>

            {/* Plot Details Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div>
                <strong>Plot No:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "80px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.plotVillaNo}
                </span>
              </div>
              <div>
                <strong>Plot Size (Sq. yd.):</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "80px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.plotSize
                    ?.replace(" sq ft", "")
                    .replace(" sq yd", "") || ""}
                </span>
              </div>
              <div>
                <strong>Basic Rate:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "80px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.basicRate}
                </span>
              </div>
            </div>

            {/* Other and Amount Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "15px",
              }}
            >
              <div style={{ flex: "1", marginRight: "20px" }}>
                <strong>Other:</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "150px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.other || ""}
                </span>
              </div>
              <div style={{ flex: "1" }}>
                <strong>Amount (Rs.):</strong>
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "150px",
                    paddingLeft: "8px",
                    fontWeight: "normal",
                    fontSize: "13px",
                  }}
                >
                  {receipt.amount}
                </span>
              </div>
            </div>

            {/* Amount in Words Row */}
            <div style={{ marginBottom: "20px" }}>
              <strong>Received Sum of Rupees:</strong>
              <span
                style={{
                  borderBottom: "1px dotted #000",
                  display: "inline-block",
                  minWidth: "450px",
                  paddingLeft: "8px",
                  fontWeight: "normal",
                }}
              >
                {numberToWords(receipt.amount)}
              </span>
            </div>

            {/* Payment Methods */}
            <div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Payment Methods:</strong>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "30px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      width: "15px",
                      height: "15px",
                      border: "1px solid #000",
                      display: "inline-block",
                      marginRight: "8px",
                      textAlign: "center",
                      lineHeight: "13px",
                      fontSize: "11px",
                    }}
                  >
                    {receipt.cashChecked ? "✓" : ""}
                  </span>
                  Cash
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      width: "15px",
                      height: "15px",
                      border: "1px solid #000",
                      display: "inline-block",
                      marginRight: "8px",
                      textAlign: "center",
                      lineHeight: "13px",
                      fontSize: "11px",
                    }}
                  >
                    {receipt.chequeChecked ? "✓" : ""}
                  </span>
                  Cheque No:
                  <span
                    style={{
                      borderBottom: "1px dotted #000",
                      display: "inline-block",
                      minWidth: "120px",
                      marginLeft: "8px",
                      paddingLeft: "4px",
                      fontWeight: "normal",
                    }}
                  >
                    {receipt.chequeNo || ""}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    width: "15px",
                    height: "15px",
                    border: "1px solid #000",
                    display: "inline-block",
                    marginRight: "8px",
                    textAlign: "center",
                    lineHeight: "13px",
                    fontSize: "11px",
                  }}
                >
                  {receipt.rtgsChecked ? "✓" : ""}
                </span>
                RTGS/NEFT/UPI:
                <span
                  style={{
                    borderBottom: "1px dotted #000",
                    display: "inline-block",
                    minWidth: "120px",
                    marginLeft: "8px",
                    paddingLeft: "4px",
                    fontWeight: "normal",
                  }}
                >
                  {receipt.rtgsNeft || ""}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              Terms & Conditions
            </div>
            <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
              {receipt.receiptType?.toLowerCase() === 'token' ? (
                <>
                  <div>1. Token amount will be expire after 7 days</div>
                  <div>2. Refund applicable within 7 days only</div>
                  <div>
                    3. After token expires, amount can be adjusted only in the next
                    booking (Self referral), not refunded.
                  </div>
                </>
              ) : (
                <>
                  <div>1. This is a booking receipt for plot reservation</div>
                  <div>2. Balance amount to be paid as per payment schedule</div>
                  <div>3. Plot will be registered after 60% payment completion</div>
                  <div>4. All payments are subject to company terms and conditions</div>
                </>
              )}
            </div>
          </div>

          {/* Signature Area - Moved higher */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "25px",
              marginTop: "15px",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  borderTop: "1px solid #000",
                  paddingTop: "10px",
                  minWidth: "200px",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                  SUBH SANKALP ESTATE PVT. LTD.
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontStyle: "italic",
                    marginTop: "4px",
                  }}
                >
                  (Authorised Signatory)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section - Bottom Images */}
        <div>
          {/* Bottom Images Row - Properly aligned with even larger sizes */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            {/* Bottom Left Image - Further increased size */}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <img
                src="/bottom.jpg"
                alt="Bottom Left"
                className="max-w-full h-auto"
                style={{
                  maxHeight: "150px",
                  maxWidth: "300px",
                  display: "block",
                }}
              />
            </div>

            {/* Bottom Right Image - Further increased size */}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <img
                src="/addres.png"
                alt="Address"
                className="max-w-full h-auto"
                style={{
                  maxHeight: "150px",
                  maxWidth: "300px",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptTemplate;
