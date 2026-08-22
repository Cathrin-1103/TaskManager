import { Express } from "express";
import swaggerUi from "swagger-ui-express";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Task Management API",
    version: "1.0.0",
    description: "RESTful Task Management API with JWT Authentication, Idempotent Likes, Threaded Comments, and Due Dates",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT Bearer token",
      },
    },
    schemas: {
      Comment: {
        type: "object",
        properties: {
          id: { type: "string", example: "101" },
          userId: { type: "string", example: "2" },
          userEmail: { type: "string", example: "sarah@taskmanager.com" },
          username: { type: "string", example: "sarah" },
          text: { type: "string", example: "Tested on iOS Safari, login works smoothly now!" },
          createdAt: { type: "string", format: "date-time", example: "2026-08-22T19:00:00.000Z" },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string", example: "1" },
          userId: { type: "string", example: "1" },
          authorUsername: { type: "string", example: "alex" },
          authorEmail: { type: "string", example: "alex@taskmanager.com" },
          title: { type: "string", example: "Fix broken login button on mobile view" },
          done: { type: "boolean", example: false },
          dueDate: { type: "string", format: "date-time", example: "2026-12-31T23:59:59.000Z" },
          createdAt: { type: "string", format: "date-time", example: "2026-08-22T18:00:00.000Z" },
          likes: {
            type: "array",
            items: { type: "string" },
            example: ["1", "2"],
          },
          comments: {
            type: "array",
            items: { $ref: "#/components/schemas/Comment" },
          },
        },
        required: ["id", "title", "done"],
      },
      RegisterInput: {
        type: "object",
        properties: {
          username: { type: "string", example: "alex" },
          email: { type: "string", example: "alex@taskmanager.com" },
          password: { type: "string", example: "Password123!" },
        },
        required: ["username", "email", "password"],
      },
      LoginInput: {
        type: "object",
        properties: {
          email: { type: "string", example: "alex@taskmanager.com" },
          password: { type: "string", example: "Password123!" },
        },
        required: ["email", "password"],
      },
      CreateTaskInput: {
        type: "object",
        properties: {
          title: { type: "string", example: "Fix broken login button on mobile view" },
          dueDate: { type: "string", format: "date-time", example: "2026-12-31T23:59:59.000Z" },
        },
        required: ["title"],
      },
      UpdateTaskInput: {
        type: "object",
        properties: {
          title: { type: "string", example: "Update API endpoints for profile picture upload" },
          done: { type: "boolean", example: true },
          dueDate: { type: "string", format: "date-time", example: "2026-12-31T23:59:59.000Z" },
        },
      },
      CommentInput: {
        type: "object",
        properties: {
          text: { type: "string", example: "Tested on iOS Safari, login works smoothly now!" },
        },
        required: ["text"],
      },
      TokenResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          username: { type: "string", example: "alex" },
          email: { type: "string", example: "alex@taskmanager.com" },
        },
      },
      LogoutInput: {
        type: "object",
        properties: {
          refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
        },
        required: ["refreshToken"],
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Operation completed successfully" },
        },
      },
    },
  },
  paths: {
    "/api-status": {
      get: {
        summary: "API Health Check",
        description: "Check if the Task API service is running.",
        responses: {
          200: {
            description: "API is running",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  example: "Task API is running!",
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        summary: "Register user",
        description: "Register a new user account with a Username, Email Address, and Password.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
          400: {
            description: "Validation error (invalid regex or duplicate email)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login user",
        description: "Authenticate user credentials with Email and Password to receive access and refresh JWT tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Authentication successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TokenResponse",
                },
              },
            },
          },
          401: {
            description: "Invalid email or password",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout user",
        description: "Invalidate refresh token so it cannot be reused.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LogoutInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
          400: {
            description: "Refresh token is required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
    },
    "/tasks": {
      get: {
        summary: "Get all tasks",
        description: "Retrieve all tasks in the shared team workspace sorted by newest first.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Dictionary of tasks mapped by ID",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: {
                    $ref: "#/components/schemas/Task",
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Bearer token missing or invalid",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new task",
        description: "Create a technical software engineering task with an optional due date.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateTaskInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Task created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Task",
                },
              },
            },
          },
          400: {
            description: "Title is required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
          401: {
            description: "Unauthorized - Token missing or invalid",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
    },
    "/tasks/{id}": {
      put: {
        summary: "Update task by ID",
        description: "Update title, completion status, or due date of a task.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Task ID",
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/UpdateTaskInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Task updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Task",
                },
              },
            },
          },
          404: {
            description: "Task not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete task by ID",
        description: "Delete an existing task by ID.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Task ID",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "Task deleted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
          404: {
            description: "Task not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
    },
    "/tasks/{id}/like": {
      post: {
        summary: "Idempotent like task",
        description: "Idempotently add a like to a task. A user can only like a task once.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Task ID",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "Task liked successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Task",
                },
              },
            },
          },
          404: {
            description: "Task not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Idempotent unlike task",
        description: "Idempotently remove a user's like from a task.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Task ID",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "Task unliked successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Task",
                },
              },
            },
          },
          404: {
            description: "Task not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
    },
    "/tasks/{id}/comments": {
      post: {
        summary: "Add comment to task",
        description: "Add a new comment to a task.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Task ID",
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CommentInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Comment posted successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Task",
                },
              },
            },
          },
          400: {
            description: "Comment text required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
          404: {
            description: "Task not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MessageResponse",
                },
              },
            },
          },
        },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
