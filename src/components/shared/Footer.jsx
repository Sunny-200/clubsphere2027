"use client";

import React, { useState } from "react";
import Container from "@/components/miscellaneous/Container";
import Link from "next/link";
import { Modal } from "@/components/clubs/Modal";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  // Hide footer on auth pages: login and signup
  if (pathname === "/login" || pathname === "/signup") return null;
  const year = new Date().getFullYear();
  const [aboutOpen, setAboutOpen] = useState(false);
  

  return (
    <footer className="w-full border-t border-white/10 bg-transparent text-neutral-200">
      <Container className="py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-500 to-red-500">
            <Link href="/">ClubSphere</Link>
          </div>
          <div className="text-sm text-white/70">Connecting campus clubs & events</div>
        </div>

        <nav className="flex gap-6 text-sm text-white/70 items-center">
          <Link href="/clubs" className="hover:text-white">Clubs</Link>
          <button
            onClick={() => setAboutOpen(true)}
            className="hover:text-white text-sm"
            aria-haspopup="dialog"
          >
            About
          </button>

          {/* Always show a Profile link that navigates to /profile. The profile page will handle unauthenticated users. */}
          <Link href="/profile" className="hover:text-white">Profile</Link>

          <a href="https://github.com/Keerthi-vassan/CLUB_SPHERE" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
        </nav>

        <div className="text-sm text-white/60">© {year} ClubSphere. Built with Next.js.</div>
      </Container>

      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)} title="About ClubSphere">
        <div className="space-y-3 text-sm text-white/80">
          <p>
            ClubSphere is an event and club management frontend built with Next.js. It helps clubs to
            publish events, manage membership requests, and connect attendees.
          </p>

          <p className="font-semibold">Group members</p>
          <ul className="list-disc pl-5">
            <li>Keerthi Vassan</li>
            <li>Keerthi Varman</li>
            <li>Mahesh</li>
            <li>Rithwik</li>
            <li>Suvan</li>
          </ul>

          <p className="text-xs text-white/60">You can close this dialog with the Close button.</p>
        </div>
      </Modal>
    </footer>
  );
};

export default Footer;
