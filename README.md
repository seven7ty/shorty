# 👄 My simple [`worker`](https://developers.cloudflare.com/workers/) for short links
I wanted a quick-and-easy way to create links on my domain, so I turned to Cloudflare Workers.  
All routes available, apart from the base redirect, return a JSON response paired with the `Content-Type: application/json` header.  
**Every aforementioned JSON response follows this rough schema**:
- for successful `POST` requests:
```json
{
  "success": true,
  "payload": {}
}
```
- for successful `DELETE` and `PUT` requests:
```json
{
  "success": true,
  "message": "Some message."
}
```
- for *any* **unsuccessful** request:
```json
{
  "success": false,
  "message": "Error message."
}
```

## 🛣️ The routes
Requests to URLs other than `/` are handled by the worker and fall under the following spec. 

### `GET /:slug`
Runs a check against a bound KV namespace called `LINKS`, and if a slug like the one requested exists, redirects to the associated URL.  
If the slug can't be found, a JSON response is returned.

### `POST /:slug?url={url}`
Creates a **case-sensitive** entry in the KV namespace called `slug` with the value `url`.  
Requests to the above endpoint are then redirected to corresponding URLs.  
Upon successful creation (not a duplicate, etc.), a JSON response is returned:  
```json
{
  "success": true,
  "payload": {
    "slug": "The passed slug",
    "url": "The passed url"
  }
}
```

### `POST /new?url={}`
Similar to the above, except, this route randomizes the slug using [`nanoid`](https://www.npmjs.com/package/nanoid).  
Since the slug is random, it's very important to save it by reading the response:
```json
{
  "success": true,
  "payload": {
    "slug": "The nanoid-generated slug",
    "url": "The passed url"
  }
}
```

### `DELETE /:slug`
Deletes a link associated with the `slug`.

### `PUT /:slug?url={url}`
Update an existing `slug` with a new `url`. Doesn't return the new link like `POST` requests.
