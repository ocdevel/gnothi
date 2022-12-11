import weaviate from 'weaviate-client'
export const weaviateClient = weaviate.client({
  scheme: 'http',
  host: 'legio-weavi-11TMR2G3K51SQ-0cfa2a12c9f80dbd.elb.us-east-1.amazonaws.com:8080'
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
