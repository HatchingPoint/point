export const config = {
	runtime: "edge",
};

import { createPointRouteFetchHandler } from "../generated/app.js";

const handleApi = createPointRouteFetchHandler();

export default function handler(request: Request): Response | Promise<Response> {
	return handleApi(request);
}
