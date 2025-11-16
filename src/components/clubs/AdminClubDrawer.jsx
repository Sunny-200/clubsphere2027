"use client";

import { useMemo, useState } from "react";
import { Modal } from "./Modal.jsx";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdminClubDrawer({ open, onClose, onCreate, creating, currentUser }) {
  const defaultLead = useMemo(() => currentUser?.email || currentUser?._id || currentUser?.id || "", [currentUser]);
  const [form, setForm] = useState(() => ({
    name: "",
    description: "",
    lead: defaultLead,
    colead: "",
  }));
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      lead: form.lead.trim() || defaultLead,
      colead: form.colead.trim(),
    };
    if (!payload.lead) {
      setError("Provide a lead email or user id so we know who owns the club.");
      return;
    }
    try {
      await onCreate(payload);
      setForm({ name: "", description: "", lead: defaultLead, colead: "" });
    } catch (err) {
      setError(err.message || "Unable to create club");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a new club" widthClass="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">Club name</p>
          <Input
            required
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-2 bg-white/5 text-white"
            placeholder="Coding Club"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">Description</p>
          <textarea
            required
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-white"
            placeholder="Share the club's mission, focus areas, achievements..."
          />
        </div>
        <div className="space-y-5 rounded-2xl border border-white/5 bg-white/5 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Lead email or user ID</p>
            <p className="text-xs text-white/40">Defaulting to your account. Replace it if someone else is the lead.</p>
            <Input
              required
              name="lead"
              value={form.lead}
              onChange={handleChange}
              className="mt-2 bg-black/30 text-white"
              placeholder="lead@example.edu"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Co-lead email or user ID (optional)</p>
            <p className="text-xs text-white/40">Leave blank if you do not have a co-lead yet.</p>
            <Input
              name="colead"
              value={form.colead}
              onChange={handleChange}
              className="mt-2 bg-black/30 text-white"
              placeholder="colead@example.edu"
            />
          </div>
        </div>
        {error && (
          <p className="rounded-2xl bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>
        )}
        <button
          type="submit"
          className={cn(
            "w-full rounded-2xl bg-blue-600/80 px-4 py-3 text-sm font-semibold text-white",
            creating && "opacity-60"
          )}
          disabled={creating}
        >
          {creating ? "Creating..." : "Create club"}
        </button>
      </form>
    </Modal>
  );
}
