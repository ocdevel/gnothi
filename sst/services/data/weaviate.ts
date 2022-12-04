import weaviate from 'weaviate-client'
export const weaviateClient = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080'
})

export async function weaviateDo(build: any) {
  return new Promise((resolve, reject) => {
    build.do()
      .then((res) => resolve(res))
      .catch(err => {
        console.error("Weaviate error", err)
        resolve({})
        // reject(err)
      })
  })
}
