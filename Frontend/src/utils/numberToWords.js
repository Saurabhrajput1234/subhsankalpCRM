// Utility function to convert numbers to words (Indian format)
const numberToWords = (amount) => {
  if (amount === 0) return 'Zero';
  
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];
  
  const convertHundreds = (num) => {
    let result = '';
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    
    if (num > 0) {
      result += ones[num] + ' ';
    }
    
    return result.trim();
  };
  
  // Handle decimal places (paise)
  const [rupees, paise] = amount.toString().split('.');
  const rupeesNum = parseInt(rupees);
  const paiseNum = paise ? parseInt(paise.padEnd(2, '0').substring(0, 2)) : 0;
  
  let result = '';
  
  if (rupeesNum >= 10000000) { // Crores
    const crores = Math.floor(rupeesNum / 10000000);
    result += convertHundreds(crores) + ' Crore ';
    const remainder = rupeesNum % 10000000;
    if (remainder > 0) {
      if (remainder >= 100000) { // Lakhs
        const lakhs = Math.floor(remainder / 100000);
        result += convertHundreds(lakhs) + ' Lakh ';
        const remaining = remainder % 100000;
        if (remaining > 0) {
          if (remaining >= 1000) { // Thousands
            const thousands = Math.floor(remaining / 1000);
            result += convertHundreds(thousands) + ' Thousand ';
            const final = remaining % 1000;
            if (final > 0) {
              result += convertHundreds(final) + ' ';
            }
          } else {
            result += convertHundreds(remaining) + ' ';
          }
        }
      } else if (remainder >= 1000) { // Thousands
        const thousands = Math.floor(remainder / 1000);
        result += convertHundreds(thousands) + ' Thousand ';
        const final = remainder % 1000;
        if (final > 0) {
          result += convertHundreds(final) + ' ';
        }
      } else {
        result += convertHundreds(remainder) + ' ';
      }
    }
  } else if (rupeesNum >= 100000) { // Lakhs
    const lakhs = Math.floor(rupeesNum / 100000);
    result += convertHundreds(lakhs) + ' Lakh ';
    const remainder = rupeesNum % 100000;
    if (remainder > 0) {
      if (remainder >= 1000) { // Thousands
        const thousands = Math.floor(remainder / 1000);
        result += convertHundreds(thousands) + ' Thousand ';
        const final = remainder % 1000;
        if (final > 0) {
          result += convertHundreds(final) + ' ';
        }
      } else {
        result += convertHundreds(remainder) + ' ';
      }
    }
  } else if (rupeesNum >= 1000) { // Thousands
    const thousands = Math.floor(rupeesNum / 1000);
    result += convertHundreds(thousands) + ' Thousand ';
    const remainder = rupeesNum % 1000;
    if (remainder > 0) {
      result += convertHundreds(remainder) + ' ';
    }
  } else {
    result += convertHundreds(rupeesNum) + ' ';
  }
  
  result = result.trim();
  
  if (result) {
    result += ' Rupee' + (rupeesNum !== 1 ? 's' : '');
  }
  
  if (paiseNum > 0) {
    if (result) result += ' and ';
    result += convertHundreds(paiseNum) + ' Paise';
  }
  
  return result + ' Only';
};
export {
 numberToWords };