import { NextResponse } from "next/server";
import { getMe } from "@/controllers/authController.js";
import { verifyToken } from "@/lib/auth.js";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return NextResponse.json({ message: "Token invalid or expired" }, { status: 401 });
    }

    // Create fake req/res for controller compatibility
    const fakeReq = { user: { id: decoded.id } };
    const fakeRes = {
      _status: 200,
      _body: null,
      status(code) { this._status = code; return this; },
      json(obj) { this._body = obj; return this; }
    };

    await getMe(fakeReq, fakeRes);
    return NextResponse.json(fakeRes._body, { status: fakeRes._status });
  } catch (err) {
    console.error("AUTH_ME_ROUTE_ERR", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
