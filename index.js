import { Router } from 'itty-router'

const MAX_SLUG_LENGTH = 30;
const RESERVED_SLUGS = ["api", "new"];

let nanoid = (t=21) => {
  let e = "",
  r=crypto.getRandomValues(new Uint8Array(t));
  for (;t--;) {
    let n = 63 & r[t];
    e += n < 36 ? n.toString(36) : n < 62 ? (n-26).toString(36).toUpperCase() : n < 63 ? "_" : "-"
  }
  return e
};

const router = Router()


const add_link = async (slug, url) => {
  const existing = await LINKS.get(slug)
  if (existing) {
    return new_json_response({success: false, message: "Link already exists."}, {status: 409})
  } else if (slug.length > MAX_SLUG_LENGTH) {
    return new_json_response({success: false, message: "Link slug length cannot exceed 30 characters."}, {status: 400})
  } else if (RESERVED_SLUGS.includes(slug)) {
    return new_json_response({success: false, message: "Link slug cannot be one of the reserved words."}, {status: 400})
  }
  await LINKS.put(slug, url)
  return new_json_response({success: true, payload: {slug: slug, url: url}}, {status: 201})
}

const auth = request => {
  if (request.headers.get(AUTH_HEADER) !== AUTH_KEY) {
    return new_json_response({success: false, message: "Invalid auth key header supplied."}, {status: 401})
  }
}

const new_json_response = (body, init) => {
  return new Response(JSON.stringify(body), {...init, headers: {...init.headers, "Content-Type": "application/json"}});
}

router.get("/", () => {
  return new Response("Uh oh, something went wrong. (wulf plz fix)", {status: 500})
})

router.get("/:slug", async ({ params }) => {
  const link = await LINKS.get(params.slug)
  if (link) {
    return Response.redirect(link)
  } else {
    return new_json_response({success: false, message: "Link not found."}, {status: 404})
  }
})

router.post("/new", auth, async ({ query }) => {
  return await add_link(nanoid(5), query.url);
})

router.post("/:slug", auth, async request => {
  const { params, query } = request
  return await add_link(params.slug, query.url);
})

router.delete("/:slug", auth, async ({ params })=> {
  const link = await LINKS.get(params.slug)
  if (link) {
    await LINKS.delete(params.slug)
    return new_json_response({success: true, message: "Link deleted."}, {status: 200})
  } else {
    return new_json_response({success: false, message: "Link not found."}, {status: 404})
  }
})

router.put("/:slug", auth, async ({ params, query }) => {
  const link = await LINKS.get(params.slug)
  if (link) {
    await LINKS.put(params.slug, query.url)
    return new_json_response({success: true, message: "Link updated."}, {status: 200})
  } else {
    return new_json_response({success: false, message: "Link not found, create it the same way, just with a POST request."}, {status: 404})
  }
})

addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request))
})
