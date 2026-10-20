const corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin":
    process.env.FRONTEND_ORIGIN || (process.env.NODE_ENV === "development" ? "http://localhost:5173" : "https://production.app"),
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Vary": "Origin",
  "Access-Control-Max-Age": "86400",
};

export default corsHeaders;
