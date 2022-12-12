import {initDb} from './data/init/initDb'

export async function main() {
  await Promise.all([
    initDb(),
  ])
  return {statusCode: 200}
}


