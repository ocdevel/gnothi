interface Route<Input,Output,Body> {
  input: Input
  output: Output
  body: Body
}

interface Request {
  route: string
  method: "POST" | "PUT" | "GET" | "DELETE" | "PATCH"
  body: {
    userId: string
    snoopId: string
    data: any
  }
}

interface ResponseData {
  userIds: string[]
  data?: {
    data: any
  }
  triggers?: string[] // pathKeys
}

interface Response {
  data?: ResponseData[]
  triggers?: () => void
}
