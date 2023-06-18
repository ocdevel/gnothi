const errors = {
  ERROR: {
    message: "Error",
    code: 400
  },
  CANT_SNOOP: {
    message: "Can't snoop this resource",
    code: 401
  },
  NO_TAGS: {
    message: "Please select at least one tag. The Main tag is a good default",
    code: 400
  }
}

interface GnothiErrorProps {
  key?: keyof typeof errors
  code?: number
  message?: string
}

export class GnothiError extends Error {
  code: number;
  key: string;
  constructor({key = "ERROR", code= 400, message = "There was an error"}: GnothiErrorProps) {
    super(message);
    this.key = key;
    this.code = code;
  }
}

export class CantSnoop extends GnothiError {
  constructor(message = errors.CANT_SNOOP.message) {
    super({message, key: "CANT_SNOOP", code: 401})
  }
}
