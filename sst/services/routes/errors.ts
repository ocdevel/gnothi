type GnothiErrorProps {
  key: string
}
export class GnothiError extends Error {
  code: number;
  key: string;
  constructor(message: string, {code, key}: ) {
    super(message);
    this.code = code;
    this.key = key;
  }
}

export class CantSnoop extends GnothiError {
  constructor(message = "Can't snoop this resource") {
    super(message, 401)
  }
}
