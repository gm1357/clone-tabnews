export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("An unexpected internal error occurred.", {
      cause,
    });
    this.name = "InternalServerError";
    this.action = "Contact support for help.";
    this.statusCode = statusCode ?? 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message }) {
    super(message ?? "Service unavailable at the moment.", {
      cause,
    });
    this.name = "ServiceError";
    this.action = "Verefy if service is available.";
    this.statusCode = 503;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("This method is not allowed for this endpoint.");
    this.name = "MethodNotAllowedError";
    this.action = "Verify if this HTTP method is valid for this endpoint.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ValidationError extends Error {
  constructor({ message, action }) {
    super(message ?? "A validation error occurred.");
    this.name = "ValidationError";
    this.action = action ?? "Update the data sentand try again.";
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class NotFoundError extends Error {
  constructor({ message, action }) {
    super(message ?? "Resource not found.");
    this.name = "NotFoundError";
    this.action =
      action ?? "Please verify if the information is correct and try again..";
    this.statusCode = 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  constructor({ message, action }) {
    super(message ?? "User not authenticated.");
    this.name = "UnauthorizedError";
    this.action = action ?? "Try signing in again to proceed.";
    this.statusCode = 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}
