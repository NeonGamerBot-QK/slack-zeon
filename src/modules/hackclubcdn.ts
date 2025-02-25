export function uploadURL(url: string[]) {
  return fetch(`https://cdn.hackclub.com/api/v1/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer beans" 
    },
    body: JSON.stringify(url),
  }).then((r) => r.json());
}
