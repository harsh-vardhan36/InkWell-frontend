class HttpResponseBase {}
class HttpErrorResponse extends HttpResponseBase {
  constructor() {
    super();
    this.name = 'HttpErrorResponse';
    this.message = 'Http failure response for http://localhost:8080/auth/login: 500 Internal Server Error';
    this.error = { error: "Invalid email or password" };
  }
}

const error = new HttpErrorResponse();

const message =
    error.integrationHint ??
    (error instanceof Error ? error.message : null) ??
    (typeof error.error === 'string' ? error.error : null) ??
    error.error?.message ??
    error.error?.error ??
    error.error?.details ??
    (error.status === 401
        ? 'Invalid email or password.'
        : 'Unable to sign in right now. Please try again.');

console.log(message);
console.log(error instanceof Error);
