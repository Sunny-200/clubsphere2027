export function collectUserLeadership(user, clubs = []) {
  const rawUserId = user?._id || user?.id || user?.userId || null;
  if (!rawUserId) {
    return { userId: null, lead: [], colead: [] };
  }
  const normalizedUserId = String(rawUserId);

  return clubs.reduce(
    (acc, club) => {
      const leadId = typeof club?.lead === "string" ? club.lead : club?.lead?._id || club?.lead?.id;
      const coLeadId =
        typeof club?.colead === "string" ? club.colead : club?.colead?._id || club?.colead?.id;

      if (leadId && String(leadId) === normalizedUserId) {
        acc.lead.push(club);
      }
      if (coLeadId && String(coLeadId) === normalizedUserId) {
        acc.colead.push(club);
      }
      return acc;
    },
    { userId: normalizedUserId, lead: [], colead: [] }
  );
}
