// CSV Utilities for processing plot data

/**
 * Parse CSV data to plot format - Simplified and robust for your format
 */
export const parseCSVToPlotData = (csvText) => {
  console.log('Raw CSV text:', csvText.substring(0, 500)); // Debug log
  
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    console.log('Not enough lines in CSV');
    return [];
  }

  const plots = [];
  
  // Skip header line and process data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    console.log(`Processing line ${i}:`, line); // Debug log

    // Try different parsing methods
    let values = [];
    
    // Method 1: Split by comma
    if (line.includes(',')) {
      values = line.split(',').map(v => v.trim());
    }
    // Method 2: Split by tab
    else if (line.includes('\t')) {
      values = line.split('\t').map(v => v.trim());
    }
    // Method 3: Split by multiple spaces (for space-separated data)
    else {
      values = line.split(/\s+/).filter(v => v.trim());
    }

    console.log(`Parsed values for line ${i}:`, values); // Debug log

    if (values.length < 4) {
      console.log(`Skipping line ${i} - not enough values`);
      continue;
    }

    // Create plot with simple position-based mapping
    const plot = {
      plotNumber: "",
      block: "",
      registeredCompany: "",
      length: "",
      width: "",
      plotSize: "",
      basicRate: "",
      road: "",
      facing: "",
      gataKhesraNo: "",
      plcApplicable: false,
      typeofPLC: "",
      availablePlot: true,
      description: ""
    };

    // Simple mapping based on expected positions
    // Expected format: Plot Number, Block, Length, Width, Plot Size, Road, PLC Applicable, PLC Type, Facing, Registered Company, Gata/Khesra, Available, Basic Rate
    
    let idx = 0;
    
    // Plot Number (A024, B027, etc.)
    if (values[idx] && /^[A-Z]\d+$/i.test(values[idx])) {
      plot.plotNumber = values[idx].toUpperCase();
      idx++;
    }
    
    // Block (A, B, etc.)
    if (values[idx] && /^[A-Z]$/i.test(values[idx])) {
      plot.block = values[idx].toUpperCase();
      idx++;
    }
    
    // Length
    if (values[idx] && /^\d+(\.\d+)?$/.test(values[idx])) {
      plot.length = values[idx];
      idx++;
    }
    
    // Width
    if (values[idx] && /^\d+(\.\d+)?$/.test(values[idx])) {
      plot.width = values[idx];
      idx++;
    }
    
    // Plot Size
    if (values[idx]) {
      plot.plotSize = values[idx].includes('sq') ? values[idx] : `${values[idx]}`;
      idx++;
    }
    
    // Road
    if (values[idx]) {
      plot.road = values[idx];
      idx++;
    }
    
    // PLC Applicable
    if (values[idx] && /^(yes|no)$/i.test(values[idx])) {
      plot.plcApplicable = values[idx].toLowerCase() === 'yes';
      idx++;
    }
    
    // PLC Type
    if (values[idx]) {
      plot.typeofPLC = values[idx];
      idx++;
    }
    
    // Facing
    if (values[idx]) {
      // Convert abbreviated forms to full forms
      let facing = values[idx];
      if (facing.toLowerCase() === 'n-e') facing = 'North East';
      else if (facing.toLowerCase() === 'n-w') facing = 'North West';
      else if (facing.toLowerCase() === 's-e') facing = 'South East';
      else if (facing.toLowerCase() === 's-w') facing = 'South West';
      
      plot.facing = facing;
      idx++;
    }
    
    // Registered Company
    if (values[idx]) {
      plot.registeredCompany = values[idx];
      idx++;
    }
    
    // Gata/Khesra
    if (values[idx] && /^\d+$/.test(values[idx])) {
      plot.gataKhesraNo = values[idx];
      idx++;
    }
    
    // Available
    if (values[idx] && /^(yes|no)$/i.test(values[idx])) {
      plot.availablePlot = values[idx].toLowerCase() === 'yes';
      idx++;
    }
    
    // Basic Rate
    if (values[idx] && /^\d+$/.test(values[idx])) {
      plot.basicRate = values[idx];
      idx++;
    }

    console.log(`Created plot for line ${i}:`, plot); // Debug log

    // Add plot if we have minimum required data
    if (plot.plotNumber) {
      plots.push(plot);
    }
  }

  console.log('Final parsed plots:', plots); // Debug log
  return plots;
};

/**
 * Validate plot data
 */
export const validatePlotData = (plots) => {
  const errors = [];
  const warnings = [];

  plots.forEach((plot, index) => {
    const rowNum = index + 1;
    
    // Critical errors (will prevent creation)
    if (!plot.plotNumber || plot.plotNumber.trim() === '') {
      errors.push(`Row ${rowNum}: Plot number is required`);
    }
    
    if (!plot.basicRate || parseFloat(plot.basicRate) <= 0) {
      errors.push(`Row ${rowNum}: Valid basic rate is required (got: ${plot.basicRate})`);
    }
    
    // Warnings (won't prevent creation but should be noted)
    if (!plot.plotSize || plot.plotSize.trim() === '') {
      warnings.push(`Row ${rowNum}: Plot size is missing`);
    }
    
    if (!plot.block || plot.block.trim() === '') {
      warnings.push(`Row ${rowNum}: Block is missing`);
    }
    
    if (!plot.facing || plot.facing.trim() === '') {
      warnings.push(`Row ${rowNum}: Facing direction is missing`);
    }
    
    if (!plot.registeredCompany || plot.registeredCompany.trim() === '') {
      warnings.push(`Row ${rowNum}: Registered company is missing`);
    }
  });

  return { errors, warnings };
};