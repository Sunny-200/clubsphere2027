'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Container from '@/components/miscellaneous/Container';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useClubsData } from '@/hooks/useClubsData';
import { UserRoleCard, friendlyRoleLabel } from '@/components/shared/UserRoleCard';
import { collectUserLeadership } from '@/lib/collectUserLeadership';

export default function ProfilePage() {
  const { user, loading, token, logout } = useAuthUser();
  const { clubs, loading: clubsLoading } = useClubsData(token);

  const leadershipAssignments = useMemo(() => collectUserLeadership(user, clubs), [user, clubs]);
  // Only treat `loading` as a page-level spinner when we have a token to validate.
  // If there's no token, we should show the unauthenticated UI immediately instead of "Loading profile…".
  const checkingSession = Boolean(token) && loading;
  const pageLoading = checkingSession || clubsLoading;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-black py-24 text-white">
        <Container className="w-full text-center">
          <p className="text-white/70">Loading profile…</p>
        </Container>
      </div>
    );
  }

 

  const { lead, colead } = leadershipAssignments;
  const totalLeadership = lead.length + colead.length;

  return (
    <div className="min-h-screen bg-black py-20 text-white">
      <Container className="w-full flex-col gap-10">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">Profile</p>
          <h1 className="text-4xl font-semibold">Your access overview</h1>
          <p className="text-white/60">Review your current role, permissions and clubs you help lead.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          <UserRoleCard
            user={user}
            leadClubs={lead}
            coLeadClubs={colead}
            initialOpen
            showProfileLink={false}
          />

          <section className="rounded-[36px] border border-white/10 bg-white/5 p-6 text-white/80">
            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">Account</p>
                <h2 className="text-2xl font-semibold text-white">General details</h2>
              </div>
              <dl className="grid gap-4 md:grid-cols-2">
                <InfoRow label="Display name" value={user.name || user.username || user.email?.split('@')[0]} />
                <InfoRow label="Email" value={user.email || '—'} />
                <InfoRow label="Role" value={friendlyRoleLabel(user.role)} />
                <InfoRow label="User ID" value={user._id || user.id || '—'} />
              </dl>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-white/40">Leadership impact</p>
                {totalLeadership ? (
                  <p className="mt-1 text-lg font-semibold text-white">
                    {totalLeadership} active leadership assignment{totalLeadership === 1 ? '' : 's'}
                  </p>
                ) : (
                  <p className="mt-1 text-white/60">You are currently a general member.</p>
                )}
                <p className="text-white/60">
                  Leads can edit recruitment and events. Admins can additionally create or delete clubs.
                </p>
              </div>

              <div className="space-y-4">
                <LeadershipList title="Lead" clubs={lead} accent="emerald" />
                <LeadershipList title="Co-lead" clubs={colead} accent="sky" />
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/clubs"
                  className="rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:border-white/60"
                >
                  Back to clubs
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    window.location.href = '/';
                  }}
                  className="rounded-xl bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="mt-1 text-base font-semibold text-white break-all">{value || '—'}</p>
    </div>
  );
}

function LeadershipList({ title, clubs, accent }) {
  if (!clubs?.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-white/60">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">No assignments yet</p>
      </div>
    );
  }

  const accentClasses =
    accent === 'emerald'
      ? 'border-emerald-500/30 bg-emerald-500/10'
      : 'border-sky-500/30 bg-sky-500/10';

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 space-y-3 text-sm text-white/80">
        {clubs.map((club) => (
          <li
            key={club._id || club.id || club.name}
            className={`rounded-2xl border px-3 py-2 ${accentClasses}`}
          >
            <p className="font-semibold text-white">{club.name}</p>
            <p className="text-xs text-white/70 line-clamp-2">{club.description || 'No description provided.'}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
