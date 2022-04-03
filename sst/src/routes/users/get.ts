import z from 'zod'

export const Input = z.object({})

export const Output = z.object({
  userId: z.string(),
  email: z.string().email()
})

type Input = z.infer<typeof Input>
type Output = z.infer<typeof Output>

export default class Route {
  public readonly input = Input
  public readonly output = Output
  static async route(input: Input): Promise<Output> {
    return {
      data: [
        {userId: 'x', email: 'x@y.com'}
      ]
  }
  }
}
