'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from "@/components/ui/Sparkles";
import Container from "@/components/miscellaneous/Container";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    
    if (token) {
      // User is authenticated, redirect to /clubs
      router.push("/clubs");
    } else {
      // User is not authenticated, show home page
      setIsChecking(false);
    }
  }, [router]);

  // Show loading state while checking authentication
  if (isChecking) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="flex flex-col items-center  text-5xl justify-center min-h-screen py-2 bg-black text-neutral-50 h-full w-full">
      <Container >
        <div className="z-10 text-center flex flex-col gap-8 items-center justify-center mt-48 mb-32">
          <div className="text-7xl">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-[length:200%_200%] animate-gradient font-bold">
               ClubSphere!
            </span>
          </div>
          <div className="text-2xl max-w-[60vw] text-neutral-300">
            No more messy group chats or lost sign-up links. With ClubSphere,
            you can explore clubs, apply for memberships, and stay updated — all
            in one app. Your campus life, finally organized.
          </div>

          <div>
            <button className="font-semibold bg-gray-700 hover:bg-gray-600 text-2xl px-4 py-2 rounded-lg"><Link href={"/signup"}>Get started</Link></button>
          </div>
        </div>
      </Container>
    </div>
  );
}
