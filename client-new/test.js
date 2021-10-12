// https://thomason-isaiah.medium.com/writing-integration-tests-for-websocket-servers-using-jest-and-ws-8e5c61726b2a
// https://jestjs.io/docs/getting-started

const WebSocket = require("ws");

const url = "wss://qdtdc0rwac.execute-api.us-east-1.amazonaws.com/$default"
// wscat -c 'wss://041pq1lzx2.execute-api.us-east-1.amazonaws.com/$default'

function waitForSocketState(socket, state) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      if (socket.readyState === state) {
        resolve();
      } else {
        waitForSocketState(socket, state).then(resolve);
      }
    }, 5);
  });
}

test('adds 1 + 2 to equal 3', async () => {
  const ws = new WebSocket(url)
  await waitForSocketState(ws, ws.OPEN);

  let response;
  ws.on("message", (data) => {
    response = data;
    // Close the client after it receives the response
    ws.close();
  });


  const immediateRes = await ws.send("hello there")
  await waitForSocketState(ws, ws.CLOSED);
  console.log({immediateRes,  response});
  expect(true).toBe(true);
});
