import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth Server API",
      version: "1.0.0",
      description:
        "JWT authentication via httpOnly cookie with CSRF protection",
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "access_token",
          description: "httpOnly JWT cookie set on login/signup",
        },
        csrfHeader: {
          type: "apiKey",
          in: "header",
          name: "x-xsrf-token",
          description:
            "CSRF token echoed from the XSRF-TOKEN cookie. Required alongside cookieAuth for mutating requests.",
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "app.ts"),
    path.join(__dirname, "modules/**/*.routes.ts"),
    path.join(__dirname, "app.js"),
    path.join(__dirname, "modules/**/*.routes.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
