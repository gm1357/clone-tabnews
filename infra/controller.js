const { MethodNotAllowedError, InternalServerError } = require("./errors");

function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(err, req, res) {
  const publicErrorObject = new InternalServerError({
    statusCode: err.statusCode,
    cause: err,
  });
  console.error(publicErrorObject);
  res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

export const errorHandlers = {
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
};
