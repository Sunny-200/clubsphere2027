// /app/api/auth/route.js
import { NextResponse } from "next/server";
import { signup, login, googleAuth, getMe } from "../../../controllers/authController.js";
import { loginSchema, signupSchema, googleAuthSchema } from "../../../validation/authSchemas.js";
import { protect } from "../../../middleware/authMiddleware.js";

/**
 * Note: Next.js App Router runs route handlers differently than Express.
 * We implement small wrappers to call our controller functions.
 *
 * We'll perform request body parsing & validation here, then call controllers.
 */

// Helper: run controller (controller expects (req,res))
async function runController(controller, req) {
  // create minimal fake res object that has status and json for controllers to use
  const res = {
    _status: 200,
    _body: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(obj) {
      this._body = obj;
      return this;
    }
  };
  await controller(req, res);
  return NextResponse.json(res._body, { status: res._status });
}

export async function POST(req) {
  // We route by a `type` field or by query param `action`
  // expected endpoint usage:
  // POST /api/auth?action=signup
  // POST /api/auth?action=login
  // POST /api/auth?action=google
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  const body = await req.json();

  try {
    if (action === "signup") {
      // Validate
      signupSchema.parse(body);
      // wrap req/res for controller
      const fakeReq = { body };
      return await runController(signup, fakeReq);
    }

    if (action === "login") {
      loginSchema.parse(body);
      const fakeReq = { body };
      return await runController(login, fakeReq);
    }

    if (action === "google") {
      googleAuthSchema.parse(body);
      const fakeReq = { body };
      return await runController(googleAuth, fakeReq);
    }

    return NextResponse.json({ message: "Unknown action" }, { status: 400 });
  } catch (err) {
    // Zod validation error
    if (err?.issues) {
      return NextResponse.json({ message: "Validation failed", errors: err.issues }, { status: 422 });
    }
    console.error("AUTH_ROUTE_POST_ERR", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function GET(req) {
  // /api/auth/me -> must be protected. The Next.js handler has no express middleware,
  // so we manually run token parsing like in middleware.
  try {
    // Reuse protect logic (but protect expects (req,res,next)), so we emulate.
    // Simpler: parse token from header and verify using lib/auth.
    console.log("GET /api/auth called");
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) return NextResponse.json({ message: "Not authorized" }, { status: 401 });

    // We import verifyToken directly to decode token
    const { verifyToken } = await import("../../../lib/auth.js");
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return NextResponse.json({ message: "Token invalid or expired" }, { status: 401 });
    }

    const fakeReq = { user: { id: decoded.id } };
    const fakeRes = {
      _status: 200,
      _body: null,
      status(code) { this._status = code; return this; },
      json(obj) { this._body = obj; return this; }
    };

    // call controller.getMe but it expects req.user to be set. We'll set req.user accordingly.
    const { getMe: controllerGetMe } = await import("@/controllers/authController.js");
    // Build req with user attached
    const reqForController = { user: { id: decoded.id } };
    await controllerGetMe(reqForController, fakeRes);
    return NextResponse.json(fakeRes._body, { status: fakeRes._status });
  } catch (err) {
    console.error("AUTH_ROUTE_GET_ERR", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
