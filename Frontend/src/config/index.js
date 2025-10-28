// Application configuration
const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  apiBaseUrlHttp: import.meta.env.VITE_API_BASE_URL_HTTP,

  // Application Configuration
  appName: import.meta.env.VITE_APP_NAME,
  appVersion: import.meta.env.VITE_APP_VERSION ,

  // Environment
  nodeEnv: import.meta.env.VITE_NODE_ENV || "development",
  isDevelopment: import.meta.env.VITE_NODE_ENV === "development",
  isProduction: import.meta.env.VITE_NODE_ENV === "production",

  // Features
  enableSwagger: import.meta.env.VITE_ENABLE_SWAGGER === "true",
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === "true",

  // URLs
  swaggerUrl:
    import.meta.env.VITE_NODE_ENV === "production"
      ? "https://subh-sankalp-estate.azurewebsites.net/swagger"
      : "http://localhost:5007/swagger",

  // Default pagination
  defaultPageSize: 10,
  maxPageSize: 100,

  // Token expiry (in days)
  tokenExpiryDays: 7,
  customerTokenExpiryDays: 30,

  // File upload limits
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ["pdf", "jpg", "jpeg", "png", "doc", "docx"],

  // Date formats
  dateFormat: "dd/MM/yyyy",
  dateTimeFormat: "dd/MM/yyyy HH:mm",

  // Currency
  currency: "INR",
  currencySymbol: "₹",

  // Company Settings
  companySecretKey:
    import.meta.env.VITE_COMPANY_SECRET_KEY ,
  companyName: import.meta.env.VITE_COMPANY_NAME || "Subh Sankalp Estate",
};

export default config;
