export class RouteError extends Error {
  code;
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

export class CantSnoop extends RouteError {
  constructor(message = "Can't snoop this resource") {
    super(message, 401)
  }
}
