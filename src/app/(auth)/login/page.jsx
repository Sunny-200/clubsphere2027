"use client";
import React, { useState } from "react";
import Container from "@/components/miscellaneous/Container";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import axios from "axios";
import Link from "next/link";



const Page = () => {
  // ✅ Manage form input via state
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // handle input change
  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("/api/auth?action=login", form);

      setMessage("Login successful! Redirecting...");
      console.log("Login success:", res.data);

      // optional: store token or user data in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // redirect to dashboard/home after login
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Invalid credentials or server error.";
      setMessage(errorMsg);
      console.error("Login failed:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="h-screen flex justify-center items-center">
      <div className="w-[500px] flex flex-col justify-evenly items-center h-[600px] shrink-0 bg-zinc-700 rounded-4xl text-center">
        <h2 className="text-3xl font-medium">Login into ClubSphere</h2>

        <form
          className="text-start flex-col gap-4 z-100 w-[80%]"
          onSubmit={handleSubmit}
        >
          <div className="mb-4 flex flex-col gap-1">
            <LabelInputContainer className="mb-4">
              <Label htmlFor="email" className="text-neutral-200">
                Email
              </Label>
              <Input
                className="bg-zinc-500"
                id="email"
                placeholder="chirag@iiitdwd.ac.in"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
            </LabelInputContainer>

            <LabelInputContainer className="mb-4">
              <Label htmlFor="password" className="text-neutral-200">
                Password
              </Label>
              <div className="relative">
                <Input
                  className="bg-zinc-500 pr-10"
                  id="password"
                  placeholder="*****"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <IconEyeOff className="h-5 w-5" />
                  ) : (
                    <IconEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </LabelInputContainer>
          </div>

          <button
            disabled={loading}
            className={cn(
              "group/btn relative block h-10 w-full rounded-md bg-linear-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]",
              "dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]",
              loading && "opacity-70 cursor-not-allowed"
            )}
            type="submit"
          >
            {loading ? "Signing in..." : "Sign in →"}
            <BottomGradient />
          </button>

          {message && (
            <p
              className={cn(
                "mt-3 text-sm text-center",
                message.includes("success")
                  ? "text-green-400"
                  : "text-red-400"
              )}
            >
              {message}
            </p>
          )}

          <div className="text-sm mt-4">
            New to ClubSphere?{" "}
            <Link
              href={"/signup"}
              className="underline text-blue-200 hover:text-blue-300"
            >
              Register here
            </Link>
          </div>

          <div className="my-8 h-1px w-full bg-linear-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
        </form>
      </div>
    </Container>
  );
};

export default Page;





const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};