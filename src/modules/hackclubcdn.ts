export function uploadURL(url: string) {
  return fetch(`https://cdn-2moycvmxo.hackclub.dev/api/v1/new`, {
    method: "POST",
    body: JSON.stringify([url]),
  }).then((r) => r.json());
}
