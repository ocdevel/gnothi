
export class GnothiError extends Error {
  code: number;
  key: string;
  constructor(message: string, key:string="ERROR", code:number=400) {
    super(message);
    this.key = key;
    this.code = code;
  }
}

export class CantSnoop extends GnothiError {
  constructor(message = "Can't snoop this resource") {
    super(message, "CANT_SNOOP", 401)
  }
}
