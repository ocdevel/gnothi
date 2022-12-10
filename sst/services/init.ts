import {initDb} from './data/init/initDb'
// import {initWeaviate} from './data/init/initWeaviate'

export async function main() {
  await Promise.all([
    initDb(),
    // initWeaviate()
  ])
  return {statusCode: 200}
}


