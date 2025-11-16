import React from "react";
import Container from "@/components/miscellaneous/Container";
import Link from "next/link";

export const metadata = {
  title: "About (moved) — ClubSphere",
  description: "About moved to an in-page popup.",
};

export default function AboutPage() {
  return (
    <html>
      <body className="bg-black text-neutral-100">
        <Container className="py-12">
          <div className="max-w-3xl mx-auto text-sm text-white/80">
            <h1 className="text-2xl font-bold mb-3">About (moved)</h1>
            <p className="mb-3">This About page has been replaced by an in-page popup. Please use the About button in the site footer to open the popup without leaving the current page.</p>
            <p>If you reached this page by accident, go back <Link href="/">home</Link>.</p>
          </div>
        </Container>
      </body>
    </html>
  );
}
