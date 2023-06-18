export class TextsParamsMatch extends Error {
  constructor() {
    super("summarize: pass texts/params such that texts.length == params.length or params.length == 1")
  }
}
