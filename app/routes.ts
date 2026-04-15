import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  layout("routes/_auth.tsx", [
    layout("routes/_auth._dashboard.tsx", [
      index("routes/_auth._dashboard._index.tsx"),
      route(":bucket", "routes/_auth._dashboard.$bucket.tsx"),
      route(":bucket/*", "routes/_auth._dashboard.$bucket.$.tsx"),
    ]),
  ]),
  route("api/s3", "routes/api.s3.ts"),
  route("api/health", "routes/api.health.ts"),
] satisfies RouteConfig;
