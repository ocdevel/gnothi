import weaviate from "weaviate-client"


export async function initDb() {
  // https://weaviate.io/developers/weaviate/current/client-libraries/javascript.html
  const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
  });

  client
    .schema
    .getter()
    .do()
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.error(err)
    });
}
