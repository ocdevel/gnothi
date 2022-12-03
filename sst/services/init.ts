import {initDb} from './data/init/init'

export async function main() {
  await initDb()
  return {statusCode: 200}
}
